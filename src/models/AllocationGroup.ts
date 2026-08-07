import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

export const ALLOCATION_STATUS = [
  "DRAFT",
  "SECTIONS_CALCULATED",
  "CLUSTERS_CONFIGURED",
  "ALLOCATED",
  "VALIDATED",
  "FINALIZED",
] as const;
export type AllocationStatus = (typeof ALLOCATION_STATUS)[number];

/**
 * One allocation group per Course. Since Module 1's courseCode is globally
 * unique and a Course carries exactly one regulation/semester/category,
 * grouping by `course` is equivalent to grouping by
 * Course Category + Course Code + Regulation + Semester — different courses
 * (even in the same category) always get different groups.
 */
const AllocationGroupSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, unique: true },
    sectionCapacity: { type: Number, default: 60, min: 1 },
    // null = use the default balanced 50:50 split.
    cluster1Sections: { type: Number, default: null, min: 0 },
    status: { type: String, enum: ALLOCATION_STATUS, default: "DRAFT" },
    finalizedAt: { type: Date },
    finalizedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reopenedAt: { type: Date },
    reopenedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export type AllocationGroupDoc = InferSchemaType<typeof AllocationGroupSchema> & { _id: Types.ObjectId };
export const AllocationGroup: Model<AllocationGroupDoc> =
  models.AllocationGroup || model<AllocationGroupDoc>("AllocationGroup", AllocationGroupSchema);
