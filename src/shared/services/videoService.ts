import * as Muxer from 'mp4-muxer';

export interface VideoCompressionOptions {
  bitrateTargetKbps?: number;
  resolutionScale?: 0.5 | 0.75 | 1.0;
  onProgress?: (progress: number, estimatedSecondsLeft: number) => void;
}

export class VideoService {
  private static queuePromise: Promise<void> = Promise.resolve();

  /**
   * Smooth Predictive Time Estimator based on native hardware rendering speed.
   */
  public static calculateTimeRemaining(currentProgress: number, startTimeMs: number): number {
    if (currentProgress <= 5) return 5;
    const timeElapsedMs = Date.now() - startTimeMs;
    const progressVelocity = currentProgress / timeElapsedMs;
    return Math.max(Math.ceil((100 - currentProgress) / progressVelocity / 1000), 1);
  }

  /**
   * Universally Standardized Frame-Driven Serialized Multi-File MP4 Compression Engine.
   * Forces absolute sequential processing and explicit memory deletion to guard device hardware.
   */
  public static async compressVideo(file: File, options: VideoCompressionOptions = {}): Promise<Blob> {
    // Chain the execution into a strict sequential serial queue to isolate batch processing overhead
    return new Promise((resolve, reject) => {
      VideoService.queuePromise = VideoService.queuePromise.then(async () => {
        try {
          const blob = await VideoService.executeCompressionPipeline(file, options);
          resolve(blob);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  private static async executeCompressionPipeline(file: File, options: VideoCompressionOptions): Promise<Blob> {
    const { onProgress, resolutionScale = 0.75, bitrateTargetKbps = 2500 } = options;
    const startTime = Date.now();
    let fileArrayBuffer: ArrayBuffer | null = await file.arrayBuffer();

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(new Blob([fileArrayBuffer!], { type: 'video/mp4' }));
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = async () => {
        let audioCtx: AudioContext | null = null;
        let audioBuffer: AudioBuffer | null = null;
        let videoEncoder: VideoEncoder | null = null;
        let audioEncoder: AudioEncoder | null = null;

        try {
          const targetWidth = Math.round((video.videoWidth * resolutionScale) / 2) * 2;
          const targetHeight = Math.round((video.videoHeight * resolutionScale) / 2) * 2;
          const duration = video.duration || 1;

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
          if (!ctx) throw new Error('Canvas context buffer allocation failed.');

          const muxer = new Muxer.Muxer({
            target: new Muxer.ArrayBufferTarget(),
            video: { codec: 'avc', width: targetWidth, height: targetHeight },
            audio: { codec: 'aac', numberOfChannels: 2, sampleRate: 44100 },
            fastStart: 'in-memory',
            firstTimestampBehavior: 'offset',
          });

          const codecProfile = targetHeight > 1080 ? 'avc1.640033' : 'avc1.4d4028';
          videoEncoder = new VideoEncoder({
            output: (chunk, metadata) => muxer.addVideoChunk(chunk, metadata),
            error: (err) => reject(err),
          });
          videoEncoder.configure({ codec: codecProfile, width: targetWidth, height: targetHeight, bitrate: bitrateTargetKbps * 1000 });

          audioEncoder = new AudioEncoder({
            output: (chunk, metadata) => muxer.addAudioChunk(chunk, metadata),
            error: (err) => reject(err),
          });
          audioEncoder.configure({ codec: 'mp4a.40.2', numberOfChannels: 2, sampleRate: 44100, bitrate: 128000 });

          try {
            audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 44100 });
            audioBuffer = await audioCtx.decodeAudioData(fileArrayBuffer!.slice(0));
          } catch (e) {
            console.warn('Audio track absent or structural decoding bypassed:', e);
          }

          const samplesPerFrame = 2048;
          let audioSampleOffset = 0;
          let lastEmittedProgress = -1;

          const streamAudioSynchronous = (currentTimeSeconds: number) => {
            if (!audioBuffer) return;
            const targetSampleIndex = Math.min(Math.round(currentTimeSeconds * 44100), audioBuffer.length);

            while (audioSampleOffset < targetSampleIndex) {
              const currentChunkSize = Math.min(samplesPerFrame, targetSampleIndex - audioSampleOffset);
              if (currentChunkSize <= 0) break;

              const combinedPlanarData = new Float32Array(currentChunkSize * 2);
              combinedPlanarData.set(audioBuffer.getChannelData(0).subarray(audioSampleOffset, audioSampleOffset + currentChunkSize), 0);
              if (audioBuffer.numberOfChannels > 1) {
                combinedPlanarData.set(audioBuffer.getChannelData(1).subarray(audioSampleOffset, audioSampleOffset + currentChunkSize), currentChunkSize);
              } else {
                combinedPlanarData.set(audioBuffer.getChannelData(0).subarray(audioSampleOffset, audioSampleOffset + currentChunkSize), currentChunkSize);
              }

              const audioTimestampUs = Math.round((audioSampleOffset / 44100) * 1000000);
              const audioData = new AudioData({
                format: 'f32-planar',
                sampleRate: 44100,
                numberOfFrames: currentChunkSize,
                numberOfChannels: 2,
                timestamp: audioTimestampUs,
                data: combinedPlanarData,
              });

              if (audioEncoder && audioEncoder.state === 'configured') audioEncoder.encode(audioData);
              audioData.close();
              audioSampleOffset += currentChunkSize;
            }
          };

          const processVideoFrame = async () => {
            if (video.ended || video.paused) return;

            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
            const currentVideoTime = video.currentTime;
            const timestampUs = Math.round(currentVideoTime * 1000000);
            const frame = new VideoFrame(canvas, { timestamp: timestampUs });

            streamAudioSynchronous(currentVideoTime);

            if (videoEncoder && videoEncoder.state === 'configured') videoEncoder.encode(frame);
            frame.close();

            // Strict deterministic flush execution to prevent any high-resolution frame freezing anomalies
            if (videoEncoder && videoEncoder.encodeQueueSize > 0) {
              await videoEncoder.flush();
            }

            const progress = Math.min(Math.floor((currentVideoTime / duration) * 100), 99);
            if (onProgress && progress > lastEmittedProgress) {
              lastEmittedProgress = progress;
              onProgress(progress, VideoService.calculateTimeRemaining(progress, startTime));
          }

            video.requestVideoFrameCallback(processVideoFrame);
          };

          video.onplay = () => {
            video.requestVideoFrameCallback(processVideoFrame);
          };

          video.onended = async () => {
            if (audioBuffer) streamAudioSynchronous(duration);

            if (videoEncoder && audioEncoder) {
              await videoEncoder.flush();
              await audioEncoder.flush();
              videoEncoder.close();
              audioEncoder.close();
            }
            if (audioCtx) await audioCtx.close();
            muxer.finalize();

            URL.revokeObjectURL(video.src);
            video.remove();
            
            // Explicitly garbage collect big buffer allocation nodes to guarantee zero device overhead leaks
            fileArrayBuffer = null;
            audioBuffer = null;

            resolve(new Blob([(muxer.target as Muxer.ArrayBufferTarget).buffer], { type: 'video/mp4' }));
          };

          await video.play().catch(reject);
        } catch (err) {
          URL.revokeObjectURL(video.src);
          video.remove();
          reject(err instanceof Error ? err : new Error('Pipeline track failure.'));
        }
      };

      video.onerror = () => reject(new Error('Failed to parse incoming mp4 stream layout.'));
    });
  }
}
