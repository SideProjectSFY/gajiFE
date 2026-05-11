import Link from 'next/link';

export default function NotFound() {
  return (
    <section className='not-found-page'>
      <div className='not-found-language'>
        <img src='/Globe.svg' alt='' aria-hidden='true' />
        한국어
      </div>

      <div className='not-found-content'>
        <img src='/Logo.svg' alt='Gaji' className='not-found-logo' />
        <h1>404</h1>
        <h2>길을 잃으셨나요?</h2>
        <p>
          찾으시는 페이지는 존재하지 않는 시나리오입니다.
          <br />
          이야기의 가지가 여기서 끊겼거나, 아직 자라나지 않은 것 같아요.
        </p>

        <div className='not-found-actions'>
          <Link href='/' className='not-found-primary'>
            메인 스토리로 돌아가기
          </Link>
          <Link href='/books' className='not-found-secondary'>
            새로운 이야기 찾기
          </Link>
        </div>
      </div>
    </section>
  );
}
