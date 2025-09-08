-- Create a secure function to handle bid transactions
CREATE OR REPLACE FUNCTION public.process_bid_transaction(
  p_winner_id uuid,
  p_winning_amount integer,
  p_user_id uuid,
  p_bid_id uuid,
  p_player_id uuid
) 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  v_player_exists boolean;
  v_bid_exists boolean;
  v_team_exists boolean;
  v_current_team_id uuid;
  v_old_salary integer;
  v_old_status text;
BEGIN
  -- Check if player exists and get current team/salary
  SELECT EXISTS(SELECT 1 FROM public.players WHERE id = p_player_id AND user_id = p_user_id),
         team_id, salary, status
  INTO v_player_exists, v_current_team_id, v_old_salary, v_old_status
  FROM public.players 
  WHERE id = p_player_id;
  
  -- Check if bid exists and is active
  SELECT EXISTS(SELECT 1 FROM public.player_bidding WHERE id = p_bid_id AND player_id = p_player_id AND NOT finalized)
  INTO v_bid_exists;
  
  -- Check if team exists
  SELECT EXISTS(SELECT 1 FROM public.teams WHERE id = p_winner_id)
  INTO v_team_exists;
  
  -- Validate all conditions
  IF NOT v_player_exists THEN
    RAISE EXCEPTION 'Player not found or invalid user association';
  END IF;
  
  IF NOT v_bid_exists THEN
    RAISE EXCEPTION 'Bid not found or already processed';
  END IF;
  
  IF NOT v_team_exists THEN
    RAISE EXCEPTION 'Team not found';
  END IF;
  
  -- Start transaction with proper isolation level
  BEGIN
    -- Update the player's team assignment with history preservation
    UPDATE public.players 
    SET 
      team_id = p_winner_id, 
      salary = p_winning_amount,
      status = 'active',
      updated_at = NOW()
    WHERE id = p_player_id
    RETURNING team_id, salary, status 
    INTO v_current_team_id, v_old_salary, v_old_status;
    
    -- Log the player transfer for audit trail
    INSERT INTO public.player_transfer_history (
      player_id, 
      from_team_id, 
      to_team_id, 
      old_salary, 
      new_salary, 
      transfer_date,
      transfer_type,
      bid_id
    ) VALUES (
      p_player_id,
      v_current_team_id,
      p_winner_id,
      v_old_salary,
      p_winning_amount,
      NOW(),
      'free_agency',
      p_bid_id
    );
    
    -- Mark the bid as won
    UPDATE public.player_bidding 
    SET 
      finalized = true,
      updated_at = NOW(),
      status = 'Won',
      processed_at = NOW(),
      bid_amount = p_winning_amount
    WHERE id = p_bid_id;
    
    -- Remove any other active bids for this player
    UPDATE public.player_bidding 
    SET 
      finalized = true,
      updated_at = NOW(),
      status = 'Outbid',
      processed_at = NOW()
    WHERE player_id = p_player_id 
    AND id != p_bid_id 
    AND finalized = false;
    
    -- Return success
    result := jsonb_build_object(
      'success', true,
      'message', 'Bid processed successfully'
    );
    
    RETURN result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error
    RAISE LOG 'Error in process_bid_transaction: %', SQLERRM;
    
    -- Return error details
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
    
    RETURN result;
  END;
END;
$$;

-- Grant execute permission to appropriate roles
GRANT EXECUTE ON FUNCTION public.process_bid_transaction(
  uuid, integer, uuid, uuid, uuid
) TO authenticated, service_role;
