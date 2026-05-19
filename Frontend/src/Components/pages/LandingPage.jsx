import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

/* ── Keyframes ───────────────────────────────────────────────── */
const fadeInUp = keyframes`
  from { opacity:0; transform:translateY(36px); }
  to   { opacity:1; transform:translateY(0);    }
`;
const fadeIn = keyframes`
  from { opacity:0; }
  to   { opacity:1; }
`;
const floatY = keyframes`
  0%,100% { transform:translateY(0);    }
  50%      { transform:translateY(-10px); }
`;
const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;
const pulseRing = keyframes`
  0%,100% { box-shadow: 0 0 0 0   rgba(76,175,80,0.45); }
  50%      { box-shadow: 0 0 0 14px rgba(76,175,80,0);   }
`;


/* ── Styled components ──────────────────────────────────────── */
const Nav = styled(Box)`
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 200;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  transition: background 0.4s ease, box-shadow 0.4s ease;
  @media(max-width:600px){ padding:0 18px; }
`;

const NavBrand = styled(Typography)`
  font-size: 1.45rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
  user-select: none;
`;

const HeroWrap = styled(Box)`
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

/* background layers */
const HeroBg = styled(Box)`
  position: absolute;
  inset: 0;
  background-image: url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=80');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  @media(max-width:900px){ background-attachment: scroll; }
`;

const HeroOverlay = styled(Box)`
  position: absolute;
  inset: 0;
  background:
    linear-gradient(170deg,
      rgba(27,94,32,0.88)   0%,
      rgba(46,125,50,0.76)  40%,
      rgba(56,142,60,0.65)  70%,
      rgba(0,0,0,0.45)     100%);
`;

/* subtle grid lines */
const HeroGrid = styled(Box)`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 52px 52px;
`;

const HeroContent = styled(Box)`
  position: relative;
  z-index: 3;
  text-align: center;
  padding: 100px 20px 60px;
  max-width: 820px;
  width: 100%;
  animation: ${fadeInUp} 0.95s ease both;
`;

/* glass CTA card — hardcoded to avoid Emotion dynamic-interpolation error */
const GlassCTA = styled(Box)`
  background: rgba(255,255,255,0.10);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255,255,255,0.22);
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  border-radius: 24px;
  padding: 48px 44px 44px;
  margin: 0 auto;
  max-width: 680px;
  @media(max-width:600px){ padding:32px 22px 28px; border-radius:18px; }
`;

const HeroTitle = styled(Typography)`
  font-size: clamp(3rem, 9vw, 6.5rem);
  font-weight: 900;
  letter-spacing: -3px;
  line-height: 1.0;
  color: #ffffff;
  text-shadow: 0 2px 24px rgba(0,0,0,0.3);
  background: linear-gradient(120deg, #ffffff 30%, #a5d6a7 60%, #ffffff 80%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${shimmer} 4s linear infinite;
`;

const HeroSubtitle = styled(Typography)`
  font-size: clamp(0.95rem, 2.4vw, 1.35rem);
  font-weight: 500;
  color: #c8e6c9;
  margin: 14px 0 0;
  letter-spacing: 0.6px;
  text-shadow: 0 1px 6px rgba(0,0,0,0.3);
`;

const HeroDesc = styled(Typography)`
  font-size: clamp(0.875rem, 1.7vw, 1.05rem);
  color: rgba(255,255,255,0.82);
  margin: 18px auto 0;
  max-width: 580px;
  line-height: 1.75;
  text-shadow: 0 1px 4px rgba(0,0,0,0.2);
`;

const BtnRow = styled(Box)`
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 36px;
`;

const PrimaryBtn = styled(Button)`
  background: #ffffff !important;
  color: #1b5e20 !important;
  font-weight: 700 !important;
  font-size: 1rem !important;
  padding: 14px 42px !important;
  border-radius: 50px !important;
  text-transform: none !important;
  box-shadow: rgba(0,0,0,0.25) 0 8px 30px !important;
  transition: all 0.3s ease !important;
  animation: ${pulseRing} 3s ease-in-out infinite;
  &:hover {
    background: #e8f5e9 !important;
    transform: translateY(-3px);
    box-shadow: rgba(0,0,0,0.35) 0 14px 40px !important;
  }
`;

const SecondaryBtn = styled(Button)`
  background: rgba(255,255,255,0.12) !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  font-size: 1rem !important;
  padding: 13px 42px !important;
  border-radius: 50px !important;
  border: 2px solid rgba(255,255,255,0.65) !important;
  text-transform: none !important;
  backdrop-filter: blur(8px) !important;
  transition: all 0.3s ease !important;
  &:hover {
    background: rgba(255,255,255,0.22) !important;
    border-color: #ffffff !important;
    transform: translateY(-3px);
  }
`;

/* stat chips row */
const ChipRow = styled(Box)`
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 32px;
`;

const StatChip = styled(Box)`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.11);
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 50px;
  padding: 8px 18px;
  backdrop-filter: blur(10px);
  animation: ${fadeIn} 1.2s ease both;
`;

/* floating glass info cards at bottom of hero */
const FloatCardsRow = styled(Box)`
  position: absolute;
  bottom: 36px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  z-index: 4;
  width: max-content;
  max-width: 90vw;
  flex-wrap: wrap;
  justify-content: center;
  @media(max-width:600px){ bottom:20px; gap:10px; }
`;

const FloatCard = styled(Box)`
  background: rgba(255,255,255,0.10);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 16px;
  padding: 14px 20px;
  min-width: 130px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  animation: ${floatY} 5s ease-in-out infinite;
  &:nth-of-type(2){ animation-delay: 0.8s; }
  &:nth-of-type(3){ animation-delay: 1.6s; }
`;

/* ── Features Section ─────────────────────────────────────── */
const FeaturesSection = styled(Box)`
  background: #f8fdf8;
  padding: 96px 24px;
`;

const SectionLabel = styled(Typography)`
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #4caf50;
  text-align: center;
  margin-bottom: 12px;
`;

const SectionTitle = styled(Typography)`
  font-size: clamp(1.7rem, 4vw, 2.5rem);
  font-weight: 800;
  color: #1b5e20;
  text-align: center;
  letter-spacing: -0.5px;
  margin-bottom: 10px;
`;

const SectionSub = styled(Typography)`
  font-size: 1rem;
  color: #5a7a5a;
  text-align: center;
  max-width: 540px;
  margin: 0 auto 56px;
  line-height: 1.7;
`;

const CardsGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(248px, 1fr));
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;
`;

const FeatureCard = styled(Box)`
  background: #ffffff;
  border-radius: 18px;
  padding: 34px 28px;
  box-shadow: rgba(0,0,0,0.07) 0 4px 22px;
  border-top: 3px solid transparent;
  transition: all 0.35s ease;
  animation: ${fadeInUp} 0.7s ease both;
  animation-delay: var(--d, 0ms);
  cursor: default;
  &:hover {
    transform: translateY(-7px);
    border-top-color: #4caf50;
    box-shadow: rgba(46,125,50,0.14) 0 16px 44px;
  }
  &:hover .icon-box-inner {
    transform: scale(1.1) rotate(-4deg);
  }
`;

/* IconBox — uses className 'icon-box-inner' so FeatureCard can target it via CSS */
const IconBox = styled(Box)`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  margin-bottom: 20px;
  transition: transform 0.3s ease;
`;

/* ── About Section ────────────────────────────────────────── */
const AboutSection = styled(Box)`
  position: relative;
  padding: 100px 24px;
  overflow: hidden;
  background-image: url('https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1600&q=75');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  @media(max-width:900px){ background-attachment:scroll; }
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,
      rgba(27,94,32,0.90) 0%,
      rgba(46,125,50,0.82) 50%,
      rgba(56,142,60,0.88) 100%);
  }
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none;
  }
`;

const AboutGlass = styled(Box)`
  background: rgba(255,255,255,0.10);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 24px;
  padding: 58px 52px;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  text-align: center;
  box-shadow: 0 16px 64px rgba(0,0,0,0.22);
  animation: ${fadeInUp} 0.85s ease both;
  @media(max-width:600px){ padding:36px 22px; border-radius:18px; }
`;

const Divider = styled(Box)`
  width: 56px;
  height: 3px;
  border-radius: 3px;
  background: linear-gradient(90deg, #a5d6a7, #4caf50);
  margin: 16px auto 24px;
`;

/* ── Footer ───────────────────────────────────────────────── */
const Footer = styled(Box)`
  background: #1b5e20;
  padding: 28px 40px;
  @media(max-width:600px){ padding:24px 20px; }
`;

const FooterInner = styled(Box)`
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
`;

const FooterLink = styled('a')`
  color: rgba(255,255,255,0.70);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s;
  cursor: pointer;
  &:hover { color: #a5d6a7; }
`;

/* ── Data ─────────────────────────────────────────────────── */
const FEATURES = [
  { icon:'🌱', title:'Soil Monitoring',      desc:'Track soil moisture and environmental conditions with precision IoT sensors.',          delay:'0ms'   },
  { icon:'📡', title:'Live Sensor Data',     desc:'Real-time monitoring from connected IoT devices deployed across your fields.',          delay:'100ms' },
  { icon:'📈', title:'Analytics Dashboard',  desc:'Visualize farm performance and trends with interactive charts and intelligent insights.',delay:'200ms' },
  { icon:'🗺️', title:'Field Tracking',      desc:'Manage and monitor agricultural fields with geospatial mapping and zone management.',   delay:'300ms' },
];

const STATS = [
  { icon:'🌡️', label:'Soil Health',   value:'Real-time' },
  { icon:'📡', label:'IoT Sensors',   value:'Connected'  },
  { icon:'📊', label:'Analytics',     value:'Live Data'  },
];

/* ── Component ────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navBg = scrolled
    ? 'rgba(27,94,32,0.97)'
    : 'rgba(27,94,32,0.30)';
  const navShadow = scrolled
    ? '0 2px 20px rgba(0,0,0,0.28)'
    : 'none';
  const navBlur = scrolled ? 'blur(14px)' : 'blur(8px)';

  return (
    <Box sx={{ fontFamily:'"system-ui",sans-serif', overflowX:'hidden', bgcolor:'#f8fdf8' }}>

      {/* ── Navbar ── */}
      <Nav sx={{ background: navBg, boxShadow: navShadow, backdropFilter: navBlur, WebkitBackdropFilter: navBlur }}>
        <NavBrand>🌿 AgriTrackr</NavBrand>
        <Box sx={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <Button
            id="nav-login-btn"
            onClick={() => navigate('/login')}
            sx={{
              color:'#fff', fontWeight:600, textTransform:'none',
              borderRadius:'50px', px:2.5, py:0.8, fontSize:'0.875rem',
              border:'1.5px solid rgba(255,255,255,0.5)',
              transition:'all 0.25s',
              '&:hover':{ background:'rgba(255,255,255,0.14)', borderColor:'#fff' }
            }}
          >
            Login
          </Button>
          <Button
            id="nav-signup-btn"
            onClick={() => navigate('/signup')}
            sx={{
              background:'#fff', color:'#1b5e20', fontWeight:700,
              textTransform:'none', borderRadius:'50px', px:2.5, py:0.8,
              fontSize:'0.875rem', transition:'all 0.25s',
              '&:hover':{ background:'#c8e6c9', transform:'translateY(-1px)' }
            }}
          >
            Sign Up
          </Button>
        </Box>
      </Nav>

      {/* ── Hero ── */}
      <HeroWrap>
        <HeroBg />
        <HeroOverlay />
        <HeroGrid />

        <HeroContent>
          <GlassCTA>
            <HeroTitle component="h1">AgriTrackr</HeroTitle>
            <HeroSubtitle>Smart Agricultural IoT Monitoring Platform</HeroSubtitle>
            <HeroDesc>
              Monitor soil conditions, crop health, sensor data, and farm analytics
              in real time using IoT technology and intelligent dashboards.
            </HeroDesc>
            <BtnRow>
              <PrimaryBtn id="hero-login-btn" size="large" onClick={() => navigate('/login')}>
                Login
              </PrimaryBtn>
              <SecondaryBtn id="hero-signup-btn" size="large" onClick={() => navigate('/signup')}>
                Create Account
              </SecondaryBtn>
            </BtnRow>
            <ChipRow>
              {STATS.map(s => (
                <StatChip key={s.label}>
                  <Typography sx={{ fontSize:'1.1rem', lineHeight:1 }}>{s.icon}</Typography>
                  <Box>
                    <Typography sx={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.6)', lineHeight:1.2 }}>{s.label}</Typography>
                    <Typography sx={{ fontSize:'0.8rem', color:'#fff', fontWeight:700, lineHeight:1.3 }}>{s.value}</Typography>
                  </Box>
                </StatChip>
              ))}
            </ChipRow>
          </GlassCTA>
        </HeroContent>

        {/* floating glass metric cards */}
        <FloatCardsRow>
          {[
            { icon:'💧', label:'Soil Moisture', val:'68%'   },
            { icon:'🌡️', label:'Temperature',  val:'24°C'  },
            { icon:'⚡',  label:'Sensors Live',  val:'12 / 12' },
          ].map(c => (
            <FloatCard key={c.label}>
              <Typography sx={{ fontSize:'1.4rem', mb:'4px', lineHeight:1 }}>{c.icon}</Typography>
              <Typography sx={{ fontSize:'1.05rem', fontWeight:800, color:'#fff', lineHeight:1.1 }}>{c.val}</Typography>
              <Typography sx={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.65)', mt:'2px' }}>{c.label}</Typography>
            </FloatCard>
          ))}
        </FloatCardsRow>
      </HeroWrap>

      {/* ── Features ── */}
      <FeaturesSection id="features">
        <Container maxWidth="lg">
          <SectionLabel>Platform Capabilities</SectionLabel>
          <SectionTitle component="h2">Everything Your Farm Needs</SectionTitle>
          <SectionSub>
            Intelligent tools for monitoring, analytics, and decision-making — all in one place.
          </SectionSub>
          <CardsGrid>
            {FEATURES.map(f => (
              <FeatureCard key={f.title} sx={{ '--d': f.delay }}>
                <IconBox className="icon-box-inner">{f.icon}</IconBox>
                <Typography sx={{ fontSize:'1.1rem', fontWeight:700, color:'#1b5e20', mb:'8px' }}>
                  {f.title}
                </Typography>
                <Typography sx={{ fontSize:'0.9rem', color:'#5a7a5a', lineHeight:1.68 }}>
                  {f.desc}
                </Typography>
              </FeatureCard>
            ))}
          </CardsGrid>
        </Container>
      </FeaturesSection>

      {/* ── About ── */}
      <AboutSection id="about">
        <AboutGlass>
          <Typography
            component="h2"
            sx={{ fontSize:'clamp(1.6rem,3.5vw,2.3rem)', fontWeight:800, color:'#fff', letterSpacing:'-0.5px' }}
          >
            About AgriTrackr
          </Typography>
          <Divider />
          <Typography
            sx={{ fontSize:'clamp(0.95rem,1.8vw,1.1rem)', color:'rgba(255,255,255,0.86)', lineHeight:1.85, maxWidth:620, mx:'auto' }}
          >
            AgriTrackr is an IoT-based agricultural monitoring platform designed to help farmers
            and agricultural organizations monitor sensors, field conditions, and farm analytics efficiently.
          </Typography>
          <Box sx={{ mt:4, display:'flex', gap:2, justifyContent:'center', flexWrap:'wrap' }}>
            <Button
              id="about-get-started-btn"
              onClick={() => navigate('/login')}
              sx={{
                background:'#fff', color:'#1b5e20', fontWeight:700,
                borderRadius:'50px', px:4, py:1.5, textTransform:'none',
                fontSize:'0.97rem', boxShadow:'rgba(0,0,0,0.22) 0 6px 22px',
                transition:'all 0.28s',
                '&:hover':{ background:'#c8e6c9', transform:'translateY(-2px)' }
              }}
            >
              Get Started
            </Button>
            <Button
              id="about-learn-btn"
              onClick={() => navigate('/signup')}
              sx={{
                background:'rgba(255,255,255,0.12)', color:'#fff', fontWeight:600,
                borderRadius:'50px', px:4, py:1.5, textTransform:'none',
                fontSize:'0.97rem', border:'2px solid rgba(255,255,255,0.5)',
                backdropFilter:'blur(8px)', transition:'all 0.28s',
                '&:hover':{ background:'rgba(255,255,255,0.2)', borderColor:'#fff' }
              }}
            >
              Create Account
            </Button>
          </Box>
        </AboutGlass>
      </AboutSection>

      {/* ── Footer ── */}
      <Footer>
        <FooterInner>
          <Typography sx={{ fontSize:'0.875rem', color:'rgba(255,255,255,0.55)', fontWeight:500 }}>
            © AgriTrackr — Smart Agricultural IoT Monitoring
          </Typography>
          <Box sx={{ display:'flex', gap:'28px', flexWrap:'wrap' }}>
            <FooterLink id="footer-about" href="#about">About</FooterLink>
            <FooterLink id="footer-contact" href="#">Contact</FooterLink>
            <FooterLink id="footer-privacy" href="#">Privacy Policy</FooterLink>
          </Box>
        </FooterInner>
      </Footer>

    </Box>
  );
}
