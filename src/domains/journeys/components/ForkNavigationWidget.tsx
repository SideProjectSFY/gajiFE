'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { css } from '../../../../styled-system/css';
import { GitBranch, CornerDownRight } from 'lucide-react';
import { useConversationStore } from '@/domains/journeys/stores/conversationStore';

interface ForkNavigationWidgetProps {
    conversationId: string;
}

export function ForkNavigationWidget({ conversationId }: ForkNavigationWidgetProps) {
  const router = useRouter();
  const { currentConversation } = useConversationStore();
  const [isExpanded, setIsExpanded] = useState(false);
  void conversationId;

  // Placeholder data - in real app would come from props or store 
  const parentId = currentConversation?.scenarioId; // Just for example logic
  const childrenForks = [
    { id: 'fork-1', title: 'Alternative Ending A' },
    { id: 'fork-2', title: 'What if he said no?' }
  ];

  if (!currentConversation) return null;

  const navigateToFork = (id: string) => {
    router.push(`/conversations/${id}`);
  };

  return (
    <div className={css({ 
      position: 'fixed', 
      bottom: '4', 
      right: '4', 
      zIndex: '50',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '2'
    })}>
      
      {isExpanded && (
        <div className={css({ 
          bg: 'white', 
          rounded: 'lg', 
          shadow: 'lg', 
          p: '4', 
          mb: '2', 
          border: '1px solid token(colors.gray.200)',
          minW: '250px'
        })}>
          <h4 className={css({ fontSize: 'sm', fontWeight: 'bold', color: 'gray.500', mb: '2' })}>Forks</h4>
          
          {parentId && (
              <button 
                onClick={() => navigateToFork(parentId)}
                className={css({ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '2', 
                    w: 'full', 
                    p: '2', 
                    rounded: 'md', 
                    _hover: { bg: 'gray.50' },
                    textAlign: 'left',
                    color: 'green.700'
                })}
              >
                <CornerDownRight size={16} className={css({ transform: 'rotate(180deg)' })} />
                <span className={css({ fontSize: 'sm' })}>Go to Parent</span>
              </button>
          )}

          <div className={css({ my: '2', borderTop: '1px solid token(colors.gray.100)' })} />

          {childrenForks.map((fork) => (
             <button 
                key={fork.id}
                onClick={() => navigateToFork(fork.id)}
                className={css({ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '2', 
                    w: 'full', 
                    p: '2', 
                    rounded: 'md', 
                    _hover: { bg: 'gray.50' },
                    textAlign: 'left'
                })}
              >
                <GitBranch size={16} />
                <span className={css({ fontSize: 'sm' })}>{fork.title}</span>
              </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={css({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bg: 'white',
          color: 'gray.800',
          rounded: 'full',
          w: '12',
          h: '12',
          shadow: 'lg',
          border: '1px solid token(colors.gray.200)',
          cursor: 'pointer',
          _hover: { bg: 'gray.50' }
        })}
      >
        <GitBranch size={20} />
      </button>
    </div>
  );
}
