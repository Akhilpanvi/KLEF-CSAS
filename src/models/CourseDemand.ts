import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

export const DEMAND_STATUS = ["DRAFT", "SUBMITTED", "REOPENED"] as const;
export type DemandStatus = (typeof DEMAND_STATUS)[number];

const CourseDemandSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    regulation: { type: Schema.Types.ObjectId, ref: "Regulation", required: true },
    semester: { type: Schema.Types.ObjectId, ref: "Semester", required: true },
    courseCategory: { type: Schema.Types.ObjectId, ref: "CourseCategory", required: true },
    status: { type: String, enum: DEMAND_STATUS, default: "DRAFT" },
    totalStudents: { type: Number, default: 0, min: 0 },
    submittedAt: { type: Date },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reopenedAt: { type: Date },
    reopenedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Prevents duplicate demand for the same course + department + regulation + semester.
CourseDemandSchema.index({ course: 1, department: 1, regulation: 1, semester: 1 }, { unique: true });
CourseDemandSchema.index({ status: 1 });

export type CourseDemandDoc = InferSchemaType<typeof CourseDemandSchema> & { _id: Types.ObjectId };
export const CourseDemand: Model<CourseDemandDoc> =
  models.CourseDemand || model<CourseDemandDoc>("CourseDemand", CourseDemandSchema);
