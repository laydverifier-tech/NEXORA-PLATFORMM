'use client';
import { AdminForm, Grid, Select } from '@/components/admin/form-kit';
import { Field } from '@/components/ui/field';
import { ROOM_STATUSES, STAGES } from '@/lib/admin/constants';
import { addRoom } from './actions';

export function RoomForm({ tournamentId }: { tournamentId: string }) {
  return (
    <AdminForm action={addRoom} submit="ADD ROOM">
      {(s) => (<>
        <input type="hidden" name="tournament_id" value={tournamentId} />
        <Grid cols={4}><Select label="Stage" name="stage" options={STAGES} /><Field name="name" label="Room name" placeholder="Room 1" required error={s.fieldErrors?.name} /><Field name="room_id" label="Room ID" required error={s.fieldErrors?.room_id} /><Field name="room_password" label="Password" error={s.fieldErrors?.room_password} /></Grid>
        <Grid><Field name="scheduled_at" label="Starts at (UTC)" type="datetime-local" error={s.fieldErrors?.scheduled_at} /><Select label="Status" name="status" options={ROOM_STATUSES} /></Grid>
      </>)}
    </AdminForm>
  );
}
