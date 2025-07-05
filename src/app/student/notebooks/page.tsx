// Student notebooks page
'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiBook, FiSearch, FiStar } from 'react-icons/fi';
import { NotebookCard } from '@/components/student/NotebookCard';
import LightbulbLoader from '@/components/shared/LightbulbLoader';
import { createClient } from '@/lib/supabase/client';
import type { Chatbot } from '@/types/database.types';
import { StudentPageTitle, StudentSectionTitle, StudentCardTitle, StudentSubtitle } from '@/styles/studentStyles';

// Define notebook interface
interface Notebook {
  notebook_id: string;
  student_id: string;
  chatbot_id: string;
  name: string;  // Database uses 'name' not 'title'
  title?: string; // Optional for compatibility
  created_at: string;
  updated_at: string;
  is_starred: boolean;
  chatbot?: Partial<Chatbot>;
  entry_count?: number;
  last_entry_date?: string;
}

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #FAFBFC 0%, #F3F4F6 100%);
  padding: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 24px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 16px;
  }
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled(motion.div)`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const Title = styled(StudentPageTitle)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  
  svg {
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const Subtitle = StudentSubtitle;

const ControlsWrapper = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const SearchBar = styled.div`
  flex: 1;
  min-width: 250px;
  position: relative;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.xl} ${theme.spacing.md} ${theme.spacing.lg}`};
  padding-left: 44px;
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: white;
  font-size: 1rem;
  font-family: ${({ theme }) => theme.fonts.body};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.primary}20;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.text.secondary};
  width: 20px;
  height: 20px;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  border: 2px solid ${({ theme, $active }) => $active ? theme.colors.brand.primary : theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme, $active }) => $active ? theme.colors.brand.primary : 'white'};
  color: ${({ theme, $active }) => $active ? 'white' : theme.colors.text.primary};
  font-size: 0.875rem;
  font-weight: 500;
  font-family: ${({ theme }) => theme.fonts.body};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
    background: ${({ theme, $active }) => $active ? theme.colors.brand.primary : theme.colors.ui.backgroundLight};
  }
`;

const NotebooksGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: ${({ theme }) => theme.spacing.lg};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxxxl} 0;
  
  svg {
    width: 64px;
    height: 64px;
    color: ${({ theme }) => theme.colors.text.muted};
    margin-bottom: ${({ theme }) => theme.spacing.lg};
  }
  
  h3 {
    margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #000000;
  }
  
  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 1.125rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const fetchNotebooks = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      // Fetch notebooks with chatbot details
      const { data: notebooksData, error } = await supabase
        .from('student_notebooks')
        .select(`
          notebook_id,
          student_id,
          chatbot_id,
          name,
          title,
          is_starred,
          created_at,
          updated_at,
          chatbot:chatbots(
            chatbot_id,
            name,
            bot_type,
            description
          )
        `)
        .eq('student_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching notebooks:', error);
        return;
      }

      // Fetch entry counts for each notebook
      const notebooksWithCounts = await Promise.all(
        (notebooksData || []).map(async (notebook) => {
          const { count } = await supabase
            .from('notebook_entries')
            .select('*', { count: 'exact', head: true })
            .eq('notebook_id', notebook.notebook_id);

          // Get last entry date
          const { data: lastEntry } = await supabase
            .from('notebook_entries')
            .select('created_at')
            .eq('notebook_id', notebook.notebook_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...notebook,
            // Use 'name' field, with title as fallback
            name: notebook.name || notebook.title || `${notebook.chatbot?.[0]?.name || 'Assistant'} Notes`,
            title: notebook.title || notebook.name || `${notebook.chatbot?.[0]?.name || 'Assistant'} Notes`,
            is_starred: notebook.is_starred ?? false,
            entry_count: count || 0,
            last_entry_date: lastEntry?.created_at,
            chatbot: notebook.chatbot?.[0] // Fix the chatbot reference
          };
        })
      );

      setNotebooks(notebooksWithCounts);
    } catch (error) {
      console.error('Error in fetchNotebooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async (notebookId: string) => {
    const notebook = notebooks.find(n => n.notebook_id === notebookId);
    if (!notebook) return;

    const newStarredState = !notebook.is_starred;

    // Optimistically update UI
    setNotebooks(prev => 
      prev.map(n => 
        n.notebook_id === notebookId 
          ? { ...n, is_starred: newStarredState }
          : n
      )
    );

    // Update in database with migration safety
    try {
      const { error } = await supabase
        .from('student_notebooks')
        .update({ is_starred: newStarredState })
        .eq('notebook_id', notebookId);

      if (error) {
        // Check if it's a column not found error
        if (error.code === 'PGRST204' && error.message.includes('is_starred')) {
          console.log('Starring feature not yet available - database migration pending');
          // Keep the UI state but show a message
          alert('Starring feature will be available soon. Please try again later.');
        } else {
          console.error('Error updating star status:', error);
        }
        // Revert on error
        setNotebooks(prev => 
          prev.map(n => 
            n.notebook_id === notebookId 
              ? { ...n, is_starred: !newStarredState }
              : n
          )
        );
      }
    } catch (err) {
      console.error('Error toggling star:', err);
      // Revert on error
      setNotebooks(prev => 
        prev.map(n => 
          n.notebook_id === notebookId 
            ? { ...n, is_starred: !newStarredState }
            : n
        )
      );
    }
  };

  // Filter notebooks based on search and starred status
  const filteredNotebooks = notebooks.filter(notebook => {
    const matchesSearch = searchQuery === '' || 
      notebook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notebook.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notebook.chatbot?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStarred = !showStarredOnly || notebook.is_starred;
    
    return matchesSearch && matchesStarred;
  });

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingContainer>
            <LightbulbLoader size="large" />
          </LoadingContainer>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <Header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Title as={motion.h1}>
            <FiBook />
            My Notebooks
          </Title>
          <Subtitle as={motion.p}>
            Your saved notes from all your learning sessions
          </Subtitle>
        </Header>

        <ControlsWrapper>
          <SearchBar>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Search notebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchBar>
          
          <FilterButton
            $active={showStarredOnly}
            onClick={() => setShowStarredOnly(!showStarredOnly)}
          >
            <FiStar />
            Starred Only
          </FilterButton>
        </ControlsWrapper>

        {filteredNotebooks.length === 0 ? (
          <EmptyState>
            <FiBook />
            <h3>No notebooks yet</h3>
            <p>
              {searchQuery || showStarredOnly
                ? "No notebooks match your filters"
                : "Start saving notes from your chat sessions to see them here"}
            </p>
          </EmptyState>
        ) : (
          <NotebooksGrid
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {filteredNotebooks.map((notebook, index) => (
              <motion.div
                key={notebook.notebook_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <NotebookCard
                  notebook={notebook}
                  onToggleStar={handleToggleStar}
                />
              </motion.div>
            ))}
          </NotebooksGrid>
        )}
      </Container>
    </PageWrapper>
  );
}