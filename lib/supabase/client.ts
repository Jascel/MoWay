import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

const SUPABASE_URL_VARIABLE =
  "NEXT_PUBLIC_SUPABASE_URL";

const SUPABASE_KEY_VARIABLE =
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

let cachedSupabaseClient:
  | SupabaseClient
  | undefined;

export class SupabaseConfigurationError extends Error {
  readonly missingVariables:
    readonly string[];

  constructor(
    missingVariables: readonly string[]
  ) {
    super(
      `Supabase is not configured. Set ${missingVariables.join(
        " and "
      )} in .env.local before calling database helpers.`
    );

    this.name =
      "SupabaseConfigurationError";

    this.missingVariables =
      missingVariables;
  }
}

export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabasePublishableKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (
    !supabaseUrl ||
    !supabasePublishableKey
  ) {
    const missingVariables = [
      ...(supabaseUrl
        ? []
        : [SUPABASE_URL_VARIABLE]),
      ...(supabasePublishableKey
        ? []
        : [SUPABASE_KEY_VARIABLE]),
    ];

    throw new SupabaseConfigurationError(
      missingVariables
    );
  }

  if (
    cachedSupabaseClient !== undefined
  ) {
    return cachedSupabaseClient;
  }

  cachedSupabaseClient =
    createClient(
      supabaseUrl,
      supabasePublishableKey
    );

  return cachedSupabaseClient;
}