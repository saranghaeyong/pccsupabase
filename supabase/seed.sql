-- ==============================================================================
-- PERSON CARD COLLECTION - INITIAL SEED DATA
-- ==============================================================================
-- Fictional demo cards for initial setup.
-- Run in the Supabase SQL Editor after running schema.sql.

INSERT INTO public.people (name, age, date_of_birth, photo_url, created_at)
VALUES
  (
    'Alex Morgan',
    24,
    '2002-04-15',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    NOW() - INTERVAL '6 hours'
  ),
  (
    'Maya Wilson',
    27,
    '1999-08-21',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    NOW() - INTERVAL '5 hours'
  ),
  (
    'Daniel Carter',
    31,
    '1995-01-10',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    NOW() - INTERVAL '4 hours'
  ),
  (
    'Sophia Brown',
    22,
    '2004-06-05',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    NOW() - INTERVAL '3 hours'
  ),
  (
    'Ethan Miller',
    29,
    '1997-11-18',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'Olivia Davis',
    25,
    '2001-03-27',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
    NOW() - INTERVAL '1 hour'
  );
