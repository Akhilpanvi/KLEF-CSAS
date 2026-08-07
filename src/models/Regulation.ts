import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const RegulationSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    name: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

RegulationSchema.index({ code: "text", name: "text" });

export type RegulationDoc = InferSchemaType<typeof RegulationSchema>;

export const Regulation: Model<RegulationDoc> =
  models.Regulation || model<RegulationDoc>("Regulation", RegulationSchema);
