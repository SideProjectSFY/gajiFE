'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { css } from '../../../../styled-system/css';
import { X, User, Zap, Globe, ArrowRight, ArrowLeft } from 'lucide-react';
import { useScenarioStore } from '@/domains/journeys/stores/scenarioStore';
import { scenarioApi } from '@/domains/journeys/services/scenarioApi';

interface CreateScenarioModalProps {
  bookId: string;
  isOpen: boolean;
  onClose: () => void;
}

type ScenarioType = 'character' | 'event' | 'setting';

export function CreateScenarioModal({ bookId, isOpen, onClose }: CreateScenarioModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ScenarioType | null>(null);
  const [title, setTitle] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setLoading, setError } = useScenarioStore();

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1 && type) setStep(2);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  const handleSubmit = async () => {
    if (!type || !title || !changeDescription) return;
    
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      const requestData = {
        book_id: bookId,
        scenario_title: title,
        character_changes: type === 'character' ? changeDescription : null,
        event_alterations: type === 'event' ? changeDescription : null,
        setting_modifications: type === 'setting' ? changeDescription : null,
      };
      
      const newScenario = await scenarioApi.createScenario(requestData);
      router.push(`/scenarios/${newScenario.id}`);
      onClose();
    } catch {
      setError('시나리오를 만들지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const renderTypeCard = (cardType: ScenarioType, icon: React.ReactNode, label: string, desc: string) => (
    <button
      onClick={() => setType(cardType)}
      className={css({
        p: '4',
        border: '2px solid',
        borderColor: type === cardType ? 'green.600' : 'gray.200',
        rounded: 'lg',
        bg: type === cardType ? 'green.50' : 'white',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s',
        _hover: { borderColor: 'green.300', bg: 'gray.50' }
      })}
    >
      <div className={css({ color: type === cardType ? 'green.700' : 'gray.600', mb: '2' })}>
        {icon}
      </div>
      <h4 className={css({ fontWeight: 'bold', mb: '1' })}>{label}</h4>
      <p className={css({ fontSize: 'sm', color: 'gray.500' })}>{desc}</p>
    </button>
  );

  return (
    <div className={css({ position: 'fixed', inset: '0', zIndex: '50', display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
      <div className={css({ position: 'absolute', inset: '0', bg: 'black/50' })} onClick={onClose} />
      
      <div className={css({ 
        position: 'relative', 
        bg: 'white', 
        rounded: 'xl', 
        w: 'full', 
        maxW: '2xl', 
        mx: '4', 
        shadow: 'xl',
        maxH: '90vh',
        overflow: 'auto'
      })}>
        <div className={css({ p: '6', borderBottom: '1px solid token(colors.gray.100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
          <h2 className={css({ fontSize: 'xl', fontWeight: 'bold' })}>
            새 가정형 가지 만들기
            <span className={css({ ml: '2', fontSize: 'sm', fontWeight: 'normal', color: 'gray.500' })}>
              {step}/2단계
            </span>
          </h2>
          <button onClick={onClose} className={css({ p: '2', rounded: 'full', _hover: { bg: 'gray.100' } })}>
            <X size={20} />
          </button>
        </div>

        <div className={css({ p: '6' })}>
          {step === 1 ? (
            <div className={css({ display: 'flex', flexDirection: 'column', gap: '6' })}>
              <div>
                <h3 className={css({ fontSize: 'lg', fontWeight: 'medium', mb: '4' })}>어떤 부분을 바꿔볼까요?</h3>
                <div className={css({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4' })}>
                  {renderTypeCard('character', <User size={24} />, '인물', '성격, 소속, 능력을 바꿔봅니다')}
                  {renderTypeCard('event', <Zap size={24} />, '사건', '중요한 사건이나 결말을 바꿔봅니다')}
                  {renderTypeCard('setting', <Globe size={24} />, '배경', '시대, 장소, 규칙을 바꿔봅니다')}
                </div>
              </div>
            </div>
          ) : (
            <div className={css({ display: 'flex', flexDirection: 'column', gap: '6' })}>
              <div>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: '2' })}>가지 제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 해리가 슬리데린에 배정됐다면?"
                  className={css({ w: 'full', p: '2', border: '1px solid token(colors.gray.300)', rounded: 'md' })}
                />
              </div>
              
              <div>
                <label className={css({ display: 'block', fontSize: 'sm', fontWeight: 'medium', mb: '2' })}>
                  바꿀 내용
                </label>
                <textarea
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  placeholder="이 변화가 이야기와 인물 관계를 어떻게 바꾸는지 적어주세요."
                  className={css({ w: 'full', h: '32', p: '2', border: '1px solid token(colors.gray.300)', rounded: 'md', resize: 'none' })}
                />
              </div>
            </div>
          )}
        </div>

        <div className={css({ p: '6', borderTop: '1px solid token(colors.gray.100)', display: 'flex', justifyContent: 'flex-end', gap: '3' })}>
          {step === 2 && (
            <button
              onClick={handleBack}
              className={css({ px: '4', py: '2', border: '1px solid token(colors.gray.300)', rounded: 'md', display: 'flex', alignItems: 'center', gap: '2' })}
              disabled={isSubmitting}
            >
              <ArrowLeft size={16} /> 이전
            </button>
          )}
          
          {step === 1 ? (
            <button
              onClick={handleNext}
              disabled={!type}
              className={css({ px: '4', py: '2', bg: 'green.700', color: 'white', rounded: 'md', display: 'flex', alignItems: 'center', gap: '2', _disabled: { opacity: 0.5 } })}
            >
              다음 <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !title || !changeDescription}
              className={css({ px: '4', py: '2', bg: 'green.700', color: 'white', rounded: 'md', display: 'flex', alignItems: 'center', gap: '2', _disabled: { opacity: 0.5 } })}
            >
              {isSubmitting ? '만드는 중입니다' : '가지 만들기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
