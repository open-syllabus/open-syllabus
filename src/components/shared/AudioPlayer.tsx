// Modern audio player component with controls
'use client';

import React, { useState, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlay, 
  FiPause, 
  FiSkipBack, 
  FiSkipForward, 
  FiVolume2, 
  FiVolumeX,
  FiDownload,
  FiLoader
} from 'react-icons/fi';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  onPlaybackComplete?: () => void;
  allowDownload?: boolean;
  className?: string;
}

const PlayerContainer = styled.div`
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  padding: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: 600px;
`;

const PlayerHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const PlayButton = styled.button<{ $isPlaying: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: ${({ theme, $isPlaying }) => 
    $isPlaying ? theme.colors.brand.secondary : theme.colors.brand.green};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    transform: scale(1.1);
    box-shadow: ${({ theme }) => theme.shadows.soft};
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const SkipButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.backgroundLight};
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ProgressContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: ${({ theme }) => theme.colors.ui.border};
  border-radius: 3px;
  position: relative;
  cursor: pointer;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${({ $progress }) => $progress}%;
  background: ${({ theme }) => theme.colors.brand.primary};
  transition: width 0.1s ease;
`;

const BufferFill = styled.div<{ $buffer: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${({ $buffer }) => $buffer}%;
  background: ${({ theme }) => theme.colors.brand.primary}30;
`;

const TimeContainer = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex: 1;
  max-width: 150px;
`;

const VolumeSlider = styled.input`
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: ${({ theme }) => theme.colors.ui.border};
  border-radius: 2px;
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    background: ${({ theme }) => theme.colors.brand.primary};
    border-radius: 50%;
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: ${({ theme }) => theme.colors.brand.primary};
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
`;

const SpeedButton = styled.button`
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  border: none;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const DownloadButton = styled.button`
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.backgroundLight};
    border-color: ${({ theme }) => theme.colors.brand.primary};
    color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const LoadingOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  
  svg {
    width: 32px;
    height: 32px;
    color: ${({ theme }) => theme.colors.brand.primary};
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export function AudioPlayer({ 
  audioUrl, 
  title = 'Audio Player',
  onPlaybackComplete,
  allowDownload = true,
  className
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [buffered, setBuffered] = useState(0);

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const setAudioLoading = () => setIsLoading(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onPlaybackComplete) onPlaybackComplete();
    };

    const updateBuffer = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / audio.duration) * 100;
        setBuffered(bufferedPercent);
      }
    };

    const handleError = (e: Event) => {
      console.error('Audio loading error:', e);
      console.error('Audio URL:', audioUrl);
      setIsLoading(false);
    };

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('loadedmetadata', setAudioLoading);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('progress', updateBuffer);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('loadedmetadata', setAudioLoading);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('progress', updateBuffer);
      audio.removeEventListener('error', handleError);
    };
  }, [onPlaybackComplete, audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSkip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audio.currentTime = newTime;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audio.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const cyclePlaybackRate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentIndex = playbackRates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % playbackRates.length;
    const newRate = playbackRates[nextIndex];
    
    setPlaybackRate(newRate);
    audio.playbackRate = newRate;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_podcast.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading audio:', error);
    }
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <PlayerContainer className={className}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <PlayerHeader>
        <Title>{title}</Title>
      </PlayerHeader>
      
      <ControlsContainer>
        <SkipButton onClick={() => handleSkip(-10)} title="Skip back 10 seconds">
          <FiSkipBack />
        </SkipButton>
        
        <PlayButton 
          $isPlaying={isPlaying} 
          onClick={togglePlay}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <FiPause /> : <FiPlay />}
        </PlayButton>
        
        <SkipButton onClick={() => handleSkip(10)} title="Skip forward 10 seconds">
          <FiSkipForward />
        </SkipButton>
        
        <VolumeContainer>
          <button onClick={toggleMute} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            {isMuted ? <FiVolumeX /> : <FiVolume2 />}
          </button>
          <VolumeSlider
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
          />
        </VolumeContainer>
        
        <SpeedButton onClick={cyclePlaybackRate}>
          {playbackRate}x
        </SpeedButton>
        
        {allowDownload && (
          <DownloadButton onClick={handleDownload}>
            <FiDownload />
            Download
          </DownloadButton>
        )}
      </ControlsContainer>
      
      <ProgressContainer>
        <ProgressBar onClick={handleProgressClick}>
          <BufferFill $buffer={buffered} />
          <ProgressFill $progress={progressPercent} />
        </ProgressBar>
        <TimeContainer>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </TimeContainer>
      </ProgressContainer>
      
      <AnimatePresence>
        {isLoading && (
          <LoadingOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FiLoader />
          </LoadingOverlay>
        )}
      </AnimatePresence>
    </PlayerContainer>
  );
}