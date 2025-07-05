'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { MessageWithMath } from '@/components/shared/MathRenderer';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 2rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const TestMessage = styled.div`
  background: ${({ theme }) => theme.colors.ui.pastelGray};
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
`;

const Input = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 4px;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 1rem;
  margin-bottom: 10px;
`;

const Button = styled.button`
  background: ${({ theme }) => theme.colors.brand.primary};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  
  &:hover {
    opacity: 0.9;
  }
`;

export default function TestMathPage() {
  const [customContent, setCustomContent] = useState('');
  
  const testMessages = [
    {
      title: 'Inline Math',
      content: 'The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ which solves any quadratic equation.'
    },
    {
      title: 'Display Math',
      content: 'The quadratic formula:\n\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\nThis formula can solve any quadratic equation of the form $ax^2 + bx + c = 0$.'
    },
    {
      title: 'Mixed Content with Markdown',
      content: '## Solving Quadratic Equations\n\nTo solve a **quadratic equation** like $3x^2 + 5x - 2 = 0$, we use:\n\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\nWhere:\n- $a = 3$\n- $b = 5$\n- $c = -2$\n\nThis gives us two solutions.'
    },
    {
      title: 'Alternative Display Math Syntax',
      content: 'You can also use the LaTeX display syntax:\n\n\\[x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\]\n\nBoth syntaxes work!'
    },
    {
      title: 'Complex Math',
      content: 'Here\'s the **Euler\'s identity**: $e^{i\\pi} + 1 = 0$\n\nAnd the integral of a Gaussian:\n\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\n\nPretty neat!'
    }
  ];
  
  return (
    <Container>
      <Title>LaTeX Math Rendering Test</Title>
      
      {testMessages.map((message, index) => (
        <TestMessage key={index}>
          <h3>{message.title}</h3>
          <MessageWithMath content={message.content} />
        </TestMessage>
      ))}
      
      <TestMessage>
        <h3>Try Your Own</h3>
        <Input
          value={customContent}
          onChange={(e) => setCustomContent(e.target.value)}
          placeholder="Enter text with LaTeX math. Use $...$ for inline and $$...$$ for display math."
        />
        {customContent && (
          <div style={{ marginTop: '20px' }}>
            <MessageWithMath content={customContent} />
          </div>
        )}
      </TestMessage>
    </Container>
  );
}