import React from 'react';

type Scene = { segundos?: string; visual?: string; texto_pantalla?: string; prompt_visual?: string };
type WildForgeProps = { slot?: number; video_id?: string; topic?: string; title?: string; description?: string; hashtags?: string; scheduled_time?: string; script?: string; scenes?: Scene[] };

const sampleProps: WildForgeProps = {
  topic: 'El pez arquero y su disparo perfecto',
  title: 'El cazador del agua',
  hashtags: '#naturaleza #animales #ciencia',
  script: 'Conoce al pez arquero. Cuando detecta un insecto sobre una hoja, dispara un chorro de agua a presión para derribarlo. Lo más fascinante es cómo compensa la refracción de la luz al pasar del agua al aire.',
  scenes: [
    { texto_pantalla: '¿Un pez que dispara agua?', visual: 'Fondo acuático oscuro con partículas luminosas' },
    { texto_pantalla: 'Calcula el ángulo', visual: 'Silueta de pez apuntando a una hoja' },
    { texto_pantalla: 'Compensa la refracción', visual: 'Chorro de agua subiendo desde el río' },
    { texto_pantalla: 'Ciencia salvaje', visual: 'Cierre documental con dato clave' }
  ]
};

const splitScript = (text: string): string[] => {
  const sentences = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.length ? sentences.slice(0, 8) : ['La naturaleza siempre guarda una sorpresa.'];
};

const wrap = (text: string, max = 34): string[] => {
  const words = String(text || '').split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > max) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
};

const Particle: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame();
  const x = (i * 137) % 1080;
  const y = ((i * 283) % 1920 + frame * (0.25 + (i % 4) * 0.08)) % 1920;
  const size = 3 + (i % 5);
  return <div style={{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: 999, background: i % 3 === 0 ? '#47f5d5' : '#f8fafc', opacity: 0.08 + (i % 5) * 0.025 }} />;
};

export const WildForgeVideo: React.FC<WildForgeProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const sentences = splitScript(props.script || '');
  const scenes = props.scenes && props.scenes.length ? props.scenes : sentences.map((s) => ({ texto_pantalla: s, visual: 'Escena documental dinámica' }));
  const introFrames = 120;
  const outroFrames = 120;
  const bodyFrames = durationInFrames - introFrames - outroFrames;
  const sceneFrames = Math.max(90, Math.floor(bodyFrames / Math.max(1, scenes.length)));
  const inIntro = frame < introFrames;
  const inOutro = frame > durationInFrames - outroFrames;
  const sceneIndex = Math.min(scenes.length - 1, Math.max(0, Math.floor((frame - introFrames) / sceneFrames)));
  const scene = scenes[sceneIndex] || scenes[0];
  const titleScale = spring({ frame, fps, config: { damping: 160, stiffness: 110 } });
  const local = Math.max(0, frame - introFrames - sceneIndex * sceneFrames);
  const opacity = interpolate(local, [0, 20, sceneFrames - 20, sceneFrames], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bgMove = interpolate(frame, [0, durationInFrames], [0, -260], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pulse = interpolate(Math.sin(frame / 22), [-1, 1], [0.86, 1.06]);
  const caption = inIntro ? props.title || props.topic || 'WildForge AI' : inOutro ? 'Síguenos para más ciencia salvaje' : scene.texto_pantalla || sentences[sceneIndex % sentences.length] || props.title || '';

  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 30% 20%, #155e75 0%, transparent 32%), radial-gradient(circle at 70% 55%, #0f766e 0%, transparent 28%), linear-gradient(180deg, #020617 0%, #07111f 42%, #001219 100%)', overflow: 'hidden', fontFamily: 'Arial, Helvetica, sans-serif', color: '#f8fafc' }}>
      <div style={{ position: 'absolute', inset: -180, translate: '0px ' + bgMove + 'px', background: 'repeating-linear-gradient(135deg, rgba(71,245,213,0.08) 0px, rgba(71,245,213,0.08) 2px, transparent 2px, transparent 92px)', opacity: 0.55 }} />
      {Array.from({ length: 80 }).map((_, i) => <Particle key={i} i={i} />)}
      <div style={{ position: 'absolute', top: 70, left: 60, right: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 32, letterSpacing: 2, fontWeight: 800, color: '#47f5d5' }}>WILDFORGE AI</div>
        <div style={{ fontSize: 26, color: '#9fb7c5' }}>{String(sceneIndex + 1).padStart(2, '0')}/{String(scenes.length).padStart(2, '0')}</div>
      </div>
      <div style={{ position: 'absolute', top: 190, left: 70, right: 70, padding: '22px 30px', border: '2px solid rgba(71,245,213,0.32)', borderRadius: 30, background: 'rgba(2, 6, 23, 0.36)', fontSize: 34, fontWeight: 800, color: '#ffd166', lineHeight: 1.15 }}>{props.topic || 'Microdocumental animal'}</div>
      <div style={{ position: 'absolute', left: 92, right: 92, top: inIntro ? 560 : 620, opacity: inIntro ? 1 : opacity, scale: inIntro ? titleScale : pulse, textAlign: 'center' }}>
        {wrap(caption, 28).map((line, idx) => <div key={idx} style={{ display: 'inline-block', margin: '8px auto', padding: '18px 26px', borderRadius: 22, background: idx === 0 ? 'rgba(71,245,213,0.92)' : 'rgba(248,250,252,0.92)', color: idx === 0 ? '#042f2e' : '#020617', fontSize: idx === 0 ? 68 : 58, fontWeight: 950, lineHeight: 1.04, boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>{line}</div>)}
      </div>
      {!inIntro && !inOutro && <div style={{ position: 'absolute', left: 90, right: 90, bottom: 310, opacity, fontSize: 36, lineHeight: 1.25, textAlign: 'center', textShadow: '0 6px 24px rgba(0,0,0,0.9)' }}>{wrap(scene.visual || 'Escena documental dinámica', 42).map((line) => <div key={line}>{line}</div>)}</div>}
      <div style={{ position: 'absolute', left: 80, right: 80, bottom: 150, height: 16, borderRadius: 999, background: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}><div style={{ width: (frame / durationInFrames) * 100 + '%', height: '100%', background: 'linear-gradient(90deg, #47f5d5, #ffd166)' }} /></div>
      <div style={{ position: 'absolute', bottom: 72, left: 70, right: 70, textAlign: 'center', fontSize: 30, color: '#9fb7c5', fontWeight: 700 }}>{props.hashtags || '#naturaleza #animales #ciencia'}</div>
    </AbsoluteFill>
  );
};

const Root: React.FC = () => <Composition id="WildForgeVideo" component={WildForgeVideo} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={sampleProps} />;
registerRoot(Root);
