"use client";

import {
  AddressDistanceListItem,
  updateAddressDistance,
} from "@/app/(dashboard)/address-distances/actions";
import {
  addressDistanceSchema,
  AddressDistanceValues,
} from "@/app/(dashboard)/address-distances/validation";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";

type Props = {
  distance: AddressDistanceListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * The reference's `Bewerk adres afstand`: the address and its kilometres, both
 * editable. Its own dialog also offers a Google lookup for the selected line;
 * ours has no such call, so the number is typed.
 */
export const EditDistanceDialog = ({
  distance,
  open,
  onOpenChange,
}: Props) => {
  const [state, dispatch, isPending] = useActionState(updateAddressDistance, {});

  const defaults: AddressDistanceValues = {
    country: distance.country ?? "",
    city: distance.city ?? "",
    street: distance.street ?? "",
    postalCode: distance.postalCode ?? "",
    km: distance.km ?? "0",
  };

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressDistanceValues>({
    resolver: zodResolver(addressDistanceSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, uuid: distance.uuid });
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Edit address distance</DialogTitle>
            <DialogDescription>
              Kilometres are the road distance from our own depot to this
              address, which is what bands a transporter&apos;s tariff.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div>
              <FormLabel htmlFor="distance-country">Country</FormLabel>
              <Input id="distance-country" {...register("country")} />
              <FormFieldError message={errors.country?.message} />
            </div>
            <div>
              <FormLabel htmlFor="distance-city">City</FormLabel>
              <Input id="distance-city" {...register("city")} />
              <FormFieldError message={errors.city?.message} />
            </div>
            <div>
              <FormLabel htmlFor="distance-street">Street</FormLabel>
              <Input id="distance-street" {...register("street")} />
              <FormFieldError message={errors.street?.message} />
            </div>
            <div>
              <FormLabel htmlFor="distance-postal-code">Postal code</FormLabel>
              <Input id="distance-postal-code" {...register("postalCode")} />
              <FormFieldError message={errors.postalCode?.message} />
            </div>
            <div>
              <FormLabel htmlFor="distance-km">Km</FormLabel>
              <Input id="distance-km" {...register("km")} />
              <FormFieldError message={errors.km?.message} />
            </div>
            <FormError>{state.error}</FormError>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset(defaults)}
              disabled={isPending}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
