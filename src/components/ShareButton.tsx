'use client';

import { useState } from 'react';
import { css } from '../../styled-system/css';
import { Share2, Check, Copy, Twitter, Facebook, Linkedin } from 'lucide-react';
import { toast } from './Toast';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string; // Optional, defaults to current URL
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? (url || window.location.href) : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async (platform?: string) => {
    if (typeof window === 'undefined') return;

    if (navigator.share && !platform) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
        toast.success('Shared successfully');
      } catch {
        // User cancelled or share failed, fallback to menu
        setIsOpen(!isOpen);
      }
    } else {
      // Fallback or specific platform share
      let openUrl = '';
      switch (platform) {
        case 'twitter':
          openUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text || title)}&url=${encodeURIComponent(shareUrl)}`;
          break;
        case 'facebook':
          openUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
          break;
        case 'linkedin':
          openUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
          break;
        default:
          setIsOpen(!isOpen);
          return;
      }
      
      if (openUrl) {
        window.open(openUrl, '_blank', 'width=600,height=400');
        setIsOpen(false);
      }
    }
  };

  return (
    <div className={css({ position: 'relative', display: 'inline-block' })}>
      <button
        onClick={() => handleShare()}
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '2',
          px: '3',
          py: '2',
          rounded: 'md',
          bg: 'white',
          border: '1px solid token(colors.gray.200)',
          color: 'gray.700',
          cursor: 'pointer',
          _hover: { bg: 'gray.50' },
          fontSize: 'sm',
          fontWeight: 'medium'
        })}
      >
        <Share2 size={16} />
        Share
      </button>

      {isOpen && (
        <>
          <div 
            className={css({ position: 'fixed', inset: '0', zIndex: '40' })} 
            onClick={() => setIsOpen(false)} 
          />
          <div className={css({
            position: 'absolute',
            top: '100%',
            right: '0',
            mt: '2',
            w: '64',
            bg: 'white',
            rounded: 'lg',
            shadow: 'xl',
            border: '1px solid token(colors.gray.200)',
            zIndex: '50',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          })}>
            <div className={css({ p: '3', borderBottom: '1px solid token(colors.gray.100)' })}>
              <div className={css({ fontSize: 'sm', fontWeight: 'bold', color: 'gray.900', mb: '1' })}>Share to</div>
              <div className={css({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2', mt: '2' })}>
                <button 
                  onClick={() => handleShare('twitter')}
                  className={css({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1', p: '2', rounded: 'md', _hover: { bg: 'green.50' }, color: 'gray.600', fontSize: 'xs' })}
                >
                  <Twitter size={20} className={css({ color: 'blue.400' })} />
                  Twitter
                </button>
                <button 
                  onClick={() => handleShare('facebook')}
                  className={css({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1', p: '2', rounded: 'md', _hover: { bg: 'green.50' }, color: 'gray.600', fontSize: 'xs' })}
                >
                  <Facebook size={20} className={css({ color: 'blue.700' })} />
                  Facebook
                </button>
                <button 
                  onClick={() => handleShare('linkedin')}
                  className={css({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1', p: '2', rounded: 'md', _hover: { bg: 'green.50' }, color: 'gray.600', fontSize: 'xs' })}
                >
                  <Linkedin size={20} className={css({ color: 'blue.800' })} />
                  LinkedIn
                </button>
              </div>
            </div>
            
            <div className={css({ p: '3', bg: 'gray.50' })}>
               <div className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'gray.500', mb: '2' })}>Or copy link</div>
               <div className={css({ display: 'flex', gap: '2' })}>
                  <input 
                    readOnly 
                    value={shareUrl} 
                    className={css({ flex: '1', fontSize: 'xs', p: '1.5', rounded: 'md', border: '1px solid token(colors.gray.300)', bg: 'white', color: 'gray.600' })}
                  />
                  <button
                    onClick={handleCopy}
                    className={css({ 
                        p: '1.5', 
                        rounded: 'md', 
                        bg: copied ? 'green.100' : 'white', 
                        border: '1px solid',
                        borderColor: copied ? 'green.300' : 'gray.300',
                        color: copied ? 'green.700' : 'gray.600',
                        cursor: 'pointer',
                        _hover: { bg: copied ? 'green.200' : 'gray.100' }
                    })}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
