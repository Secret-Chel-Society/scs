-- Create a function to check manager role
create or replace function check_manager_role(user_id_param uuid)
returns table (
  id uuid,
  role text,
  team_id uuid,
  user_id uuid
) as $$
begin
  return query
  select * from players
  where 
    user_id = user_id_param
    and (
      role = 'GM' 
      or role = 'AGM' 
      or role = 'Owner'
      or role = 'owner'
      or role ilike '%GM%'
      or role ilike '%AGM%'
      or role ilike '%Owner%'
    );
end;
$$ language plpgsql security definer;
