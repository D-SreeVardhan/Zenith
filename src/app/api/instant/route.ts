import { createInstantRouteHandler } from "@instantdb/core";
import { INSTANT_APP_ID } from "@/lib/config";

export const { POST } = createInstantRouteHandler({
  appId: INSTANT_APP_ID,
});

