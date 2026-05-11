import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthGate } from '@/domains/journeys/components/AuthGate';

export const metadata: Metadata = {
  title: '프로필 편집'
};

export default function ProfileEditPage() {
  return (
    <AuthGate>
      <main className='profile-edit-screen'>
        <section className='profile-edit-panel'>
          <h1>프로필 편집</h1>

          <div className='profile-edit-avatar-row'>
            <div className='profile-edit-avatar'>👤</div>
            <div className='profile-edit-upload'>
              <button type='button'>이미지 선택</button>
              <p>JPG 또는 PNG, 최대 5MB</p>
            </div>
          </div>

          <div className='profile-edit-control'>
            <label htmlFor='edit-username'>사용자 이름</label>
            <input id='edit-username' defaultValue='dev-bypass' />
          </div>

          <div className='profile-edit-control'>
            <label htmlFor='edit-bio'>소개</label>
            <textarea id='edit-bio' rows={5} placeholder='어떤 책과 가지를 좋아하는지 적어보세요.' />
            <p>0 / 200</p>
          </div>

          <div className='profile-edit-actions'>
            <button type='button' className='profile-edit-save'>
              변경사항 저장
            </button>
            <Link href='/profile/dev-bypass' className='profile-edit-cancel'>
              취소
            </Link>
          </div>
        </section>
      </main>
    </AuthGate>
  );
}
