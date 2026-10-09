"use client";

import { useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { ARTICLE_GROUP_LABELS } from "@/lib/labels";

// The classification taxonomy the reference groups under "Classification
// features". Held as free text for now: the reference's dropdowns were empty on
// every screen these were built from, so the option lists are still unknown.
export const ClassificationSection = () => {
  const { register, watch } = useFormContext<ProductFormValues>();
  const articleGroup = watch("articleGroup");

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Classification features
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Greyed and first on the reference: the article group is picked in
            the header, and repeated here as the root of the classification. */}
        <div>
          <FormLabel htmlFor="classificationArticleGroup">
            Article group
          </FormLabel>
          <Input
            id="classificationArticleGroup"
            readOnly
            className="bg-muted text-muted-foreground"
            value={articleGroup ? ARTICLE_GROUP_LABELS[articleGroup] : ""}
          />
        </div>
        <div>
          <FormLabel htmlFor="classificationMaterial">Material</FormLabel>
          <Input
            id="classificationMaterial"
            {...register("classificationMaterial")}
          />
        </div>
        <div>
          <FormLabel htmlFor="classificationQualityGroup">
            Quality group
          </FormLabel>
          <Input
            id="classificationQualityGroup"
            {...register("classificationQualityGroup")}
          />
        </div>
        <div>
          <FormLabel htmlFor="classificationMainShape">Main shape</FormLabel>
          <Input
            id="classificationMainShape"
            {...register("classificationMainShape")}
          />
        </div>
        <div>
          <FormLabel htmlFor="classificationSubShape">Sub shape</FormLabel>
          <Input
            id="classificationSubShape"
            {...register("classificationSubShape")}
          />
        </div>
        <div>
          <FormLabel htmlFor="classificationProcedure">Procedure</FormLabel>
          <Input
            id="classificationProcedure"
            {...register("classificationProcedure")}
          />
        </div>
        <div>
          <FormLabel htmlFor="classificationAppearance">Appearance</FormLabel>
          <Input
            id="classificationAppearance"
            {...register("classificationAppearance")}
          />
        </div>
        <div>
          <FormLabel htmlFor="classificationPerformance">Performance</FormLabel>
          <Input
            id="classificationPerformance"
            {...register("classificationPerformance")}
          />
        </div>
      </div>
    </section>
  );
};
