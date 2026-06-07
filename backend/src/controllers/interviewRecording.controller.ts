import { Request, Response } from 'express';
import { storageService } from '../services/storage.service';
import { interviewRecordingRepository } from '../repositories/interviewRecording.repository';
import path from 'path';

export class InterviewRecordingController {
  
  public uploadChunk = async (req: Request, res: Response): Promise<void> => {
    try {
      const fileId = req.body.fileId;
      const totalChunks = parseInt(req.body.totalChunks, 10);
      const fileName = req.body.fileName || 'video.webm';
      const sessionId = req.body.sessionId;
      const questionId = req.body.questionId;
      const candidateId = req.body.candidateId;

      if (!fileId || !totalChunks || !sessionId || !questionId || !candidateId) {
        res.status(400).json({ success: false, message: 'Missing required metadata' });
        return;
      }

      // Track progress
      const progress = await storageService.trackChunkProgress(fileId, totalChunks);

      // If all chunks received, merge them
      if (progress.isComplete) {
        try {
          const videoUrl = await storageService.mergeChunks(fileId, fileName, totalChunks);
          
          // Save to database
          const recording = await interviewRecordingRepository.create({
            sessionId,
            questionId,
            candidateId,
            videoUrl,
            // Assuming duration or filesize could be obtained later or passed
          });

          res.status(200).json({ 
            success: true, 
            message: 'Upload complete and merged', 
            data: recording 
          });
          return;
        } catch (mergeError: any) {
          console.error('Merge error:', mergeError);
          res.status(500).json({ success: false, message: 'Failed to merge video chunks', error: mergeError.message });
          return;
        }
      }

      // Still uploading chunks
      res.status(200).json({ 
        success: true, 
        message: 'Chunk received successfully', 
        progress: Math.round((progress.received / totalChunks) * 100) 
      });
    } catch (error: any) {
      console.error('Chunk upload error:', error);
      res.status(500).json({ success: false, message: 'Server error during chunk upload', error: error.message });
    }
  };

  public getRecording = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const recording = await interviewRecordingRepository.findById(id as string);

      if (!recording) {
        res.status(404).json({ success: false, message: 'Recording not found' });
        return;
      }

      res.status(200).json({ success: true, data: recording });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch recording', error: error.message });
    }
  };
}

export const interviewRecordingController = new InterviewRecordingController();
