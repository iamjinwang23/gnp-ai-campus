'use server'

import { createServerClient } from '@/lib/supabase-server'

interface SaveQuizResultInput {
  user_email: string
  user_name: string
  stage: 'beginner' | 'intermediate'
  score: number
  passed: boolean
}

export async function saveQuizResult(input: SaveQuizResultInput): Promise<void> {
  const supabase = createServerClient()

  const { count } = await supabase
    .from('quiz_results')
    .select('*', { count: 'exact', head: true })
    .eq('user_email', input.user_email)
    .eq('stage', input.stage)

  const attempt_number = (count ?? 0) + 1

  await supabase.from('quiz_results').insert({
    ...input,
    attempt_number,
  })
}
