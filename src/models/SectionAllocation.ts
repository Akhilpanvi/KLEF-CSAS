import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

/**
 * A single unit×section cell. Before finalization these rows are manual
 * overrides layered on top of the live-computed default distribution; on
 * finalize the full live matrix is snapshotted here so it becomes the frozen
 * record. Reopening simply resumes treating these rows as overrides.
 */
const SectionAllocationSchema = new Schema(
  {
    allocationGroup: { type: Schema.Types.ObjectId, ref: "AllocationGroup", required: true },
    unit: { type: Schema.Types.ObjectId, ref: "Unit", required: true },
    sectionNumber: { type: Number, required: true, min: 1 },
    studentCount: { type: Number, required: true, min: 0, validate: Number.isInteger },
  },
  { timestamps: true },
);

SectionAllocationSchema.index({ allocationGroup: 1, unit: 1, sectionNumber: 1 }, { unique: true });

export type SectionAllocationDoc = InferSchemaType<typeof SectionAllocationSchema> & { _id: Types.ObjectId };
export const SectionAllocation: Model<SectionAllocationDoc> =
  models.SectionAllocation || model<SectionAllocationDoc>("SectionAllocation", SectionAllocationSchema);
