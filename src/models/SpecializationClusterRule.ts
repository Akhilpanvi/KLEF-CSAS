import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

/**
 * Maps a Unit's demand (within one allocation group) to a specialization label
 * and a cluster. Specialization is a free-text, admin-configurable label — not
 * a department and never hard-coded (e.g. "Cyber Security", "Blockchain").
 */
const SpecializationClusterRuleSchema = new Schema(
  {
    allocationGroup: { type: Schema.Types.ObjectId, ref: "AllocationGroup", required: true },
    unit: { type: Schema.Types.ObjectId, ref: "Unit", required: true },
    specialization: { type: String, required: true, trim: true },
    cluster: { type: Number, enum: [1, 2], required: true },
  },
  { timestamps: true },
);

SpecializationClusterRuleSchema.index({ allocationGroup: 1, unit: 1 }, { unique: true });

export type SpecializationClusterRuleDoc = InferSchemaType<typeof SpecializationClusterRuleSchema> & {
  _id: Types.ObjectId;
};
export const SpecializationClusterRule: Model<SpecializationClusterRuleDoc> =
  models.SpecializationClusterRule ||
  model<SpecializationClusterRuleDoc>("SpecializationClusterRule", SpecializationClusterRuleSchema);
