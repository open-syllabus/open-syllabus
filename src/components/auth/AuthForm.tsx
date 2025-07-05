'use client';

import React from 'react';
import styled from 'styled-components';

const AuthFormContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
`;

interface AuthFormProps {
  type?: 'login' | 'signup' | 'teacher_login' | 'teacher_signup' | 'super_admin_login';
}

export default function AuthForm({ type = 'teacher_login' }: AuthFormProps) {
  return (
    <AuthFormContainer>
      <h2>Auth Form Placeholder</h2>
      <p>This is a placeholder for the AuthForm component.</p>
      <p>Type: {type}</p>
    </AuthFormContainer>
  );
}