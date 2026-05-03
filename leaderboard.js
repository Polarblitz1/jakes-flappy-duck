import { supabase } from './supabaseClient'

// Call this when the game ends
export async function saveScore(username, score) {
  const { data, error } = await supabase
    .from('scores')
    .insert([{ username, score }])
  
  if (error) console.error('Error saving score:', error)
  return data
}

// Call this to show the top 10 players
export async function getLeaderboard() {
  const { data, error } = await supabase
    .from('scores')
    .select('username, score')
    .order('score', { ascending: false })
    .limit(10)

  if (error) console.error('Error fetching leaderboard:', error)
  return data
}
