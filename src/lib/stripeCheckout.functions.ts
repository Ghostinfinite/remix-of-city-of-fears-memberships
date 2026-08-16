import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const checkoutSchema = z.object({
  itemId: z.string().min(1).max(60),
  percentOff: z.number().min(0).max(90).default(0),
  origin: z.string().url(),
  userId: z.string().min(1).max(120),
  email: z.string().email().optional(),
  quantity: z.number().int().min(1).max(10).optional(),
});

export const startCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data }) => {
    const { createCheckoutSession } = await import("./stripe.server");
    return await createCheckoutSession(data);
  });

export const confirmCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().min(5).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const { retrieveCheckoutSession } = await import("./stripe.server");
    return await retrieveCheckoutSession(data.sessionId);
  });
