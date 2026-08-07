import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

const CourseDemandItemSchema = new Schema(
  {
    demand: { type: Schema.Types.ObjectId, ref: "CourseDemand", required: true },
    unit: { type: Schema.Types.ObjectId, ref: "Unit", required: true },
    studentCount: { type: Number, required: true, min: 0, validate: Number.isInteger },
  },
  { timestamps: true },
);

CourseDemandItemSchema.index({ demand: 1, unit: 1 }, { unique: true });

export type CourseDemandItemDoc = InferSchemaType<typeof CourseDemandItemSchema> & { _id: Types.ObjectId };
export const CourseDemandItem: Model<CourseDemandItemDoc> =
  models.CourseDemandItem || model<CourseDemandItemDoc>("CourseDemandItem", CourseDemandItemSchema);
