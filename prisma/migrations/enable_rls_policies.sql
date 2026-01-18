-- ============================================
-- HABILITAR RLS E CRIAR POLÍTICAS DE SEGURANÇA
-- ============================================
-- Este arquivo corrige os erros de "RLS Disabled in Public"
-- habilitando Row Level Security em todas as tabelas

-- ==================== USERS ====================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid() = id::uuid);

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id::uuid);

-- ==================== FINANCE_TRANSACTIONS ====================
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.finance_transactions
    FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert their own transactions" ON public.finance_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update their own transactions" ON public.finance_transactions
    FOR UPDATE USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can delete their own transactions" ON public.finance_transactions
    FOR DELETE USING (auth.uid() = user_id::uuid);

-- ==================== STUDY_ITEMS ====================
ALTER TABLE public.study_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own study items" ON public.study_items
    FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert their own study items" ON public.study_items
    FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update their own study items" ON public.study_items
    FOR UPDATE USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can delete their own study items" ON public.study_items
    FOR DELETE USING (auth.uid() = user_id::uuid);

-- ==================== STUDY_MODULES ====================
ALTER TABLE public.study_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view study modules" ON public.study_modules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.study_items
            WHERE study_items.id = study_modules.study_item_id
            AND study_items.user_id::uuid = auth.uid()
        )
    );

CREATE POLICY "Users can insert study modules" ON public.study_modules
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.study_items
            WHERE study_items.id = study_modules.study_item_id
            AND study_items.user_id::uuid = auth.uid()
        )
    );

CREATE POLICY "Users can update study modules" ON public.study_modules
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.study_items
            WHERE study_items.id = study_modules.study_item_id
            AND study_items.user_id::uuid = auth.uid()
        )
    );

CREATE POLICY "Users can delete study modules" ON public.study_modules
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.study_items
            WHERE study_items.id = study_modules.study_item_id
            AND study_items.user_id::uuid = auth.uid()
        )
    );

-- ==================== STUDY_LESSONS ====================
ALTER TABLE public.study_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view study lessons" ON public.study_lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.study_modules
            JOIN public.study_items ON study_items.id = study_modules.study_item_id
            WHERE study_modules.id = study_lessons.module_id
            AND study_items.user_id::uuid = auth.uid()
        )
    );

CREATE POLICY "Users can insert study lessons" ON public.study_lessons
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.study_modules
            JOIN public.study_items ON study_items.id = study_modules.study_item_id
            WHERE study_modules.id = study_lessons.module_id
            AND study_items.user_id::uuid = auth.uid()
        )
    );

CREATE POLICY "Users can update study lessons" ON public.study_lessons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.study_modules
            JOIN public.study_items ON study_items.id = study_modules.study_item_id
            WHERE study_modules.id = study_lessons.module_id
            AND study_items.user_id::uuid = auth.uid()
        )
    );

CREATE POLICY "Users can delete study lessons" ON public.study_lessons
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.study_modules
            JOIN public.study_items ON study_items.id = study_modules.study_item_id
            WHERE study_modules.id = study_lessons.module_id
            AND study_items.user_id::uuid = auth.uid()
        )
    );

-- ==================== PROJECTS ====================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert their own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update their own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can delete their own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id::uuid);

-- ==================== TASKS ====================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert their own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update their own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can delete their own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id::uuid);

-- ==================== GOALS ====================
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert their own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update their own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can delete their own goals" ON public.goals
    FOR DELETE USING (auth.uid() = user_id::uuid);

-- ==================== HABITS ====================
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own habits" ON public.habits
    FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert their own habits" ON public.habits
    FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update their own habits" ON public.habits
    FOR UPDATE USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can delete their own habits" ON public.habits
    FOR DELETE USING (auth.uid() = user_id::uuid);

-- ==================== DREAM_MAPS (se existir) ====================
-- Adicionar RLS para dream_maps também
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dream_maps') THEN
        ALTER TABLE public.dream_maps ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own dream maps" ON public.dream_maps
            FOR SELECT USING (auth.uid() = user_id::uuid);
        
        CREATE POLICY "Users can insert their own dream maps" ON public.dream_maps
            FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);
        
        CREATE POLICY "Users can update their own dream maps" ON public.dream_maps
            FOR UPDATE USING (auth.uid() = user_id::uuid);
        
        CREATE POLICY "Users can delete their own dream maps" ON public.dream_maps
            FOR DELETE USING (auth.uid() = user_id::uuid);
    END IF;
END $$;

-- ==================== COMENTÁRIOS ====================
COMMENT ON POLICY "Users can view their own transactions" ON public.finance_transactions IS 
    'Permite que usuários visualizem apenas suas próprias transações financeiras';

COMMENT ON POLICY "Users can view their own study items" ON public.study_items IS 
    'Permite que usuários visualizem apenas seus próprios itens de estudo';

COMMENT ON POLICY "Users can view their own projects" ON public.projects IS 
    'Permite que usuários visualizem apenas seus próprios projetos';

COMMENT ON POLICY "Users can view their own tasks" ON public.tasks IS 
    'Permite que usuários visualizem apenas suas próprias tarefas';

COMMENT ON POLICY "Users can view their own goals" ON public.goals IS 
    'Permite que usuários visualizem apenas suas próprias metas';

COMMENT ON POLICY "Users can view their own habits" ON public.habits IS 
    'Permite que usuários visualizem apenas seus próprios hábitos';
