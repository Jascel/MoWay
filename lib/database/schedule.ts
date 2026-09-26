import { getSupabaseClient } from "@/lib/supabase/client";

export type ScheduleEventCategory =
  | "class"
  | "meeting"
  | "club"
  | "fitness"
  | "event"
  | "work";

export type ScheduleEventInput = {
  title: string;
  category: ScheduleEventCategory;
  building: string;
  room?: string;
  date: string;
  start: string;
  end: string;
};

// --------------------
// CREATE EVENT
// --------------------

export async function createScheduleEvent(
  input: ScheduleEventInput
) {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be logged in to save a schedule event."
    );
  }

  const { data, error } = await supabase
    .from("schedule_events")
    .insert({
      user_id: user.id,
      title: input.title,
      category: input.category,
      building: input.building,
      room: input.room || null,
      event_date: input.date,
      start_time: input.start,
      end_time: input.end,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// --------------------
// GET SCHEDULE FOR DATE
// --------------------

export async function getScheduleForDate(
  date: string
) {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be logged in to view your schedule."
    );
  }

  const { data, error } = await supabase
    .from("schedule_events")
    .select("*")
    .eq("user_id", user.id)
    .eq("event_date", date)
    .order("start_time", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data;
}

// --------------------
// DELETE EVENT
// --------------------

export async function deleteScheduleEvent(
  eventId: string
) {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be logged in to delete a schedule event."
    );
  }

  const { data, error } = await supabase
    .from("schedule_events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", user.id)
    .select();

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(
      "The event was not deleted from Supabase."
    );
  }

  return data[0];
}