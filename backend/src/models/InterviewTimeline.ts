import mongoose, { Schema, Document } from 'mongoose';
import { TimelineEventType } from '../types/interview.types';

export interface IInterviewTimeline extends Document {
  _id: any;
  sessionId: string; // Reference to InterviewSession _id
  eventType: TimelineEventType;
  eventData: any; // Flexible payload depending on the event type
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewTimelineSchema = new Schema<any>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: [true, 'Session ID is required'],
      index: true,
    },
    eventType: {
      type: String,
      enum: Object.values(TimelineEventType),
      required: true,
      index: true,
    },
    eventData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to easily fetch a session's timeline in chronological order
InterviewTimelineSchema.index({ sessionId: 1, timestamp: 1 });

export default mongoose.model<IInterviewTimeline>('InterviewTimeline', InterviewTimelineSchema);
