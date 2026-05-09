'use client';

/**
 * Hero 背景：彩色 mesh gradient blobs + dots 网格
 * 参考：linear.app / vercel.com 顶部渐变光晕
 * 渐变 blob 缓慢漂移，营造"科技 / 流动"感
 */

export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* === 紫色主光晕（左上） === */}
      <div
        className="blob-1 absolute -top-40 -left-40 w-[680px] h-[680px] rounded-full opacity-50"
        style={{
          background:
            'radial-gradient(circle, rgba(124, 92, 255, 0.55) 0%, rgba(124, 92, 255, 0.2) 35%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* === 蓝色辅光晕（右上） === */}
      <div
        className="blob-2 absolute -top-20 right-0 w-[560px] h-[560px] rounded-full opacity-40"
        style={{
          background:
            'radial-gradient(circle, rgba(74, 111, 255, 0.5) 0%, rgba(74, 111, 255, 0.15) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* === 粉色点缀（中下） === */}
      <div
        className="blob-3 absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full opacity-25"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 92, 168, 0.4) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* === 绿色微妙底色（右下） === */}
      <div
        className="blob-2 absolute -bottom-32 right-1/4 w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          background:
            'radial-gradient(circle, rgba(63, 207, 142, 0.4) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* === 顶部渐变蒙层（让上方更暗，文字更清晰） === */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(10, 10, 11, 0.3) 0%, transparent 30%, transparent 70%, rgba(10, 10, 11, 0.95) 100%)',
        }}
      />

      {/* === Dots 网格 === */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      {/* === Noise 质感（极微弱，增加质感） === */}
      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
