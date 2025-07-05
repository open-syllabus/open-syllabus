// src/components/teacher/StudentList.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { Card, Alert } from '@/styles/StyledComponents';
// Input import is removed as it's not used
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ModernButton } from '@/components/shared/ModernButton';

const ListContainer = styled(Card)`
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: none; 
  }
`;

const TableHeader = styled.th`
  text-align: left;
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
`;

const TableCell = styled.td`
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const LoadingState = styled(EmptyState)` // Reuse EmptyState style for consistency
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${({ theme }) => theme.spacing.sm};
`;


const MobileList = styled.div`
  display: none;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: block;
  }
`;

const MobileCard = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const MobileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const StudentName = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const MobileDetails = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 0.875rem;
  
  .label {
    color: ${({ theme }) => theme.colors.text.muted};
    margin-right: ${({ theme }) => theme.spacing.md};
  }
  
  .value {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const MobileActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const PinInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.ui.backgroundDark};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
`;

const PinInfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  
  .label {
    font-weight: 500;
    min-width: 80px;
  }
  
  .value {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-weight: 600;
    letter-spacing: 1px;
  }
`;

const PinActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

// ExpandButton is defined but not used - kept for future use
// const ExpandButton = styled.button`
//   background: none;
//   border: none;
//   color: ${({ theme }) => theme.colors.brand.primary};
//   cursor: pointer;
//   font-size: 0.875rem;
//   padding: 0;
//   display: inline-flex;
//   align-items: center;
//   margin-left: ${({ theme }) => theme.spacing.xs};
  
//   &:hover {
//     text-decoration: underline;
//   }
// `;

interface Student {
  user_id: string;
  name: string;
  email: string;
  joined_at: string | null;
  pin_code?: string;
  username?: string;
  pinLoading?: boolean;
  showPin?: boolean;
  archiving?: boolean;
  deleting?: boolean;
}

interface StudentListProps {
  roomId: string;
}

// PinResponse is defined but not directly used - kept for clarity
// interface PinResponse {
//   pin_code: string;
//   username: string;
//   studentName: string;
//   regenerated?: boolean;
// }

const ArchiveButton = styled(ModernButton)`
  background-color: ${({ theme }) => theme.colors.brand.secondary};
  color: white;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.brand.secondary};
  }
`;

const DeleteButton = styled(ModernButton)`
  background-color: ${({ theme }) => theme.colors.status.danger};
  color: white;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.status.danger};
  }
`;

const ConfirmationModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled(Card)`
  width: 100%;
  max-width: 400px;
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

export default function StudentList({ roomId }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [studentToArchive, setStudentToArchive] = useState<Student | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const router = useRouter();
  const linkInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchStudents = useCallback(async () => {
    console.log(`[StudentList] Fetching students for roomId: ${roomId}`);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/teacher/students?roomId=${roomId}`);
      
      if (!response.ok) {
        let errorMessage = `Failed to fetch students (status ${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Failed to parse error JSON
        }
        console.error(`[StudentList] API error: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('[StudentList] Students data received:', data);
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[StudentList] Catch block error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Could not load student data.');
      setStudents([]); // Clear students on error
    } finally {
      console.log('[StudentList] Setting loading to false.');
      setLoading(false);
    }
  }, [roomId]); // roomId is the dependency

  useEffect(() => {
    if (roomId) { // Only fetch if roomId is available
        fetchStudents();
    } else {
        console.warn("[StudentList] RoomId is missing, not fetching students.");
        setLoading(false); // Don't hang in loading state if no roomId
    }
  }, [roomId, fetchStudents]); // fetchStudents is stable due to useCallback

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString();
    } catch {
        return 'Invalid Date';
    }
  };

  const handleViewChats = (studentId: string) => {
    router.push(`/teacher-dashboard/students/${studentId}`);
  };
  
  const openArchiveModal = (student: Student) => {
    setStudentToArchive(student);
    setArchiveModalOpen(true);
  };
  
  const closeArchiveModal = () => {
    setArchiveModalOpen(false);
    setStudentToArchive(null);
  };
  
  const openDeleteModal = (student: Student) => {
    setStudentToDelete(student);
    setDeleteModalOpen(true);
  };
  
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setStudentToDelete(null);
  };
  
  const archiveStudent = async (studentId: string) => {
    // Mark student as archiving
    setStudents(current => 
      current.map(s => 
        s.user_id === studentId ? { ...s, archiving: true } : s
      )
    );
    
    try {
      const response = await fetch(`/api/teacher/students/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          roomId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to archive student (${response.status})`);
      }
      
      // Remove the student from the list
      setStudents(current => current.filter(s => s.user_id !== studentId));
      closeArchiveModal();
    } catch (err) {
      console.error('Error archiving student:', err);
      setError(err instanceof Error ? err.message : 'Failed to archive student');
      
      // Reset archiving state
      setStudents(current => 
        current.map(s => 
          s.user_id === studentId ? { ...s, archiving: false } : s
        )
      );
      closeArchiveModal();
    }
  };
  
  const deleteStudent = async (studentId: string) => {
    // Mark student as deleting
    setStudents(current => 
      current.map(s => 
        s.user_id === studentId ? { ...s, deleting: true } : s
      )
    );
    
    try {
      const response = await fetch(`/api/teacher/students`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          roomId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete student (${response.status})`);
      }
      
      // Remove the student from the list
      setStudents(current => current.filter(s => s.user_id !== studentId));
      closeDeleteModal();
    } catch (err) {
      console.error('Error deleting student:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete student');
      
      // Reset deleting state
      setStudents(current => 
        current.map(s => 
          s.user_id === studentId ? { ...s, deleting: false } : s
        )
      );
      closeDeleteModal();
    }
  };
  
  const fetchStudentPin = async (studentId: string) => {
    // Find the student and set loading state
    setStudents(current => 
      current.map(s => 
        s.user_id === studentId ? { ...s, pinLoading: true, showPin: true } : s
      )
    );
    
    try {
      const response = await fetch(`/api/teacher/students/pin-code?studentId=${studentId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get student PIN (${response.status})`);
      }
      
      const data = await response.json();
      
      // Update the student with the PIN code
      setStudents(current => 
        current.map(s => 
          s.user_id === studentId 
            ? { 
                ...s, 
                pin_code: data.pin_code, 
                username: data.username, 
                pinLoading: false, 
                showPin: true 
              } 
            : s
        )
      );
    } catch (err) {
      console.error('Error fetching student PIN:', err);
      setStudents(current => 
        current.map(s => 
          s.user_id === studentId 
            ? { ...s, pin_code: undefined, pinLoading: false, showPin: true } 
            : s
        )
      );
      setError(err instanceof Error ? err.message : 'Failed to get student PIN');
    }
  };
  
  const regeneratePin = async (studentId: string) => {
    // Find the student and set loading state
    setStudents(current => 
      current.map(s => 
        s.user_id === studentId ? { ...s, pinLoading: true } : s
      )
    );
    
    try {
      const response = await fetch('/api/teacher/students/pin-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to regenerate PIN (${response.status})`);
      }
      
      const data = await response.json();
      
      // Update the student with the new PIN
      setStudents(current => 
        current.map(s => 
          s.user_id === studentId 
            ? { 
                ...s, 
                pin_code: data.pin_code, 
                username: data.username, 
                pinLoading: false 
              } 
            : s
        )
      );
    } catch (err) {
      console.error('Error regenerating PIN:', err);
      setStudents(current => 
        current.map(s => 
          s.user_id === studentId ? { ...s, pinLoading: false } : s
        )
      );
      setError(err instanceof Error ? err.message : 'Failed to regenerate PIN');
    }
  };
  
  const copyToClipboard = (studentId: string) => {
    const student = students.find(s => s.user_id === studentId);
    if (!student?.pin_code || !student?.username) return;
    
    // Create a formatted text with username and PIN
    const textToCopy = `Username: ${student.username}\nPIN: ${student.pin_code}`;
    
    // Use the clipboard API
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        alert('Username and PIN copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy to clipboard:', err);
        
        // Fallback to input element select method
        const inputRef = linkInputRefs.current[studentId];
        if (inputRef) {
          inputRef.value = textToCopy;
          inputRef.select();
          document.execCommand('copy');
          alert('Username and PIN copied to clipboard!');
        }
      });
  };
  
  const togglePinDisplay = (studentId: string) => {
    const student = students.find(s => s.user_id === studentId);
    
    if (student?.showPin) {
      // Hide the PIN
      setStudents(current => 
        current.map(s => 
          s.user_id === studentId ? { ...s, showPin: false } : s
        )
      );
    } else if (student?.pin_code) {
      // Show existing PIN
      setStudents(current => 
        current.map(s => 
          s.user_id === studentId ? { ...s, showPin: true } : s
        )
      );
    } else {
      // Fetch PIN
      fetchStudentPin(studentId);
    }
  };

  const downloadCSV = async () => {
    setError(null);
    
    try {
      // First, fetch PIN codes for all students who don't have them yet
      const studentsNeedingPins = students.filter(s => !s.pin_code);
      let studentsWithPins = [...students];
      
      if (studentsNeedingPins.length > 0) {
        // Fetch pins for all students in parallel
        const pinPromises = studentsNeedingPins.map(async (student) => {
          try {
            const response = await fetch(`/api/teacher/students/pin-code?studentId=${student.user_id}`);
            if (response.ok) {
              const data = await response.json();
              return {
                user_id: student.user_id,
                pin_code: data.pin_code,
                username: data.username
              };
            }
          } catch (err) {
            console.error(`Error fetching PIN for student ${student.user_id}:`, err);
          }
          return null;
        });
        
        const pinResults = await Promise.all(pinPromises);
        
        // Update the local array with fetched PINs
        pinResults.forEach(result => {
          if (result) {
            const index = studentsWithPins.findIndex(s => s.user_id === result.user_id);
            if (index !== -1) {
              studentsWithPins[index] = {
                ...studentsWithPins[index],
                pin_code: result.pin_code,
                username: result.username
              };
            }
          }
        });
      }
      
      // Generate CSV content
      const csvHeader = 'Name,Username,PIN Code,Email,Joined Date\n';
      const csvRows = studentsWithPins.map(student => {
        const name = student.name || 'N/A';
        const username = student.username || 'N/A';
        const pin = student.pin_code || 'N/A';
        const email = student.email || 'N/A';
        const joinedDate = student.joined_at ? new Date(student.joined_at).toLocaleDateString() : 'N/A';
        
        // Escape values that might contain commas
        const escapeCsvValue = (value: string) => {
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        };
        
        return `${escapeCsvValue(name)},${escapeCsvValue(username)},${pin},${escapeCsvValue(email)},${joinedDate}`;
      }).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Generate filename with room ID and current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `students_room_${roomId}_${date}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Error downloading CSV:', err);
      setError('Failed to download student data as CSV');
    }
  };

  if (loading) {
    return (
      <ListContainer>
        <ListHeader>
          <Title>Students</Title>
        </ListHeader>
        <LoadingState><LoadingSpinner size="small" /> Loading student data...</LoadingState>
      </ListContainer>
    );
  }

  // Error display takes precedence over empty state if an error occurred
  if (error) {
    return (
      <ListContainer>
        <ListHeader>
          <Title>Students</Title>
        </ListHeader>
        <Alert variant="error">
          Error: {error}
          <ModernButton size="small" onClick={fetchStudents} style={{ marginLeft: '10px' }}>
            Retry
          </ModernButton>
        </Alert>
      </ListContainer>
    );
  }

  if (students.length === 0) {
    return (
      <ListContainer>
        <ListHeader>
          <Title>Students</Title>
        </ListHeader>
        <EmptyState>
          <p>No students have joined this room yet, or data could not be loaded.</p>
          <ModernButton size="small" onClick={fetchStudents} style={{ marginTop: '10px' }}>
            Refresh List
          </ModernButton>
        </EmptyState>
      </ListContainer>
    );
  }

  return (
    <ListContainer>
      <ListHeader>
        <Title>Students ({students.length})</Title>
        <ModernButton
          onClick={downloadCSV}
          variant="primary"
          size="small"
        >
          Download CSV
        </ModernButton>
      </ListHeader>
      
      <Table>
        <thead>
          <tr>
            <TableHeader>Name</TableHeader>
            <TableHeader>Joined</TableHeader>
            <TableHeader>Login Credentials</TableHeader>
            <TableHeader>Actions</TableHeader>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.user_id}>
              <TableCell>{student.name}</TableCell>
              <TableCell>{formatDate(student.joined_at)}</TableCell>
              <TableCell>
                {student.pinLoading ? (
                  <LoadingSpinner size="small" />
                ) : student.showPin && student.pin_code ? (
                  <PinInfoContainer>
                    <PinInfoRow>
                      <span className="label">Username:</span>
                      <span className="value">{student.username}</span>
                    </PinInfoRow>
                    <PinInfoRow>
                      <span className="label">PIN:</span>
                      <span className="value">{student.pin_code}</span>
                    </PinInfoRow>
                    <PinActions>
                      <ModernButton 
                        size="small" 
                        variant="secondary"
                        onClick={() => copyToClipboard(student.user_id)}
                      >
                        Copy
                      </ModernButton>
                      <ModernButton 
                        size="small" 
                        variant="secondary"
                        onClick={() => regeneratePin(student.user_id)}
                      >
                        New PIN
                      </ModernButton>
                      <ModernButton 
                        size="small" 
                        variant="secondary"
                        onClick={() => togglePinDisplay(student.user_id)}
                      >
                        Hide
                      </ModernButton>
                    </PinActions>
                  </PinInfoContainer>
                ) : (
                  <ModernButton 
                    size="small" 
                    variant="secondary"
                    onClick={() => togglePinDisplay(student.user_id)}
                  >
                    Show Login Info
                  </ModernButton>
                )}
              </TableCell>
              <TableCell>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <ModernButton                     size="small"
                    onClick={() => handleViewChats(student.user_id)}
                  >
                    Student Details
                  </ModernButton>
                  {student.archiving ? (
                    <ModernButton size="small" disabled>
                      <LoadingSpinner size="small" /> Archiving...
                    </ModernButton>
                  ) : (
                    <ArchiveButton
                      size="small"
                      onClick={() => openArchiveModal(student)}
                      variant="secondary"
                    >
                      Archive
                    </ArchiveButton>
                  )}
                  {student.deleting ? (
                    <ModernButton size="small" disabled>
                      <LoadingSpinner size="small" /> Deleting...
                    </ModernButton>
                  ) : (
                    <DeleteButton
                      size="small"
                      onClick={() => openDeleteModal(student)}
                      variant="secondary"
                    >
                      Delete
                    </DeleteButton>
                  )}
                </div>
              </TableCell>
            </tr>
          ))}
        </tbody>
      </Table>
      
      <MobileList>
        {students.map((student) => (
          <MobileCard key={student.user_id}>
            <MobileHeader>
              <StudentName>{student.name}</StudentName>
            </MobileHeader>
            <MobileDetails>
              <span className="label">Joined:</span>
              <span className="value">{formatDate(student.joined_at)}</span>
              {student.showPin && student.pin_code && (
                <>
                  <span className="label">Username:</span>
                  <span className="value">{student.username}</span>
                  <span className="label">PIN:</span>
                  <span className="value">{student.pin_code}</span>
                </>
              )}
            </MobileDetails>
            <MobileActions>
              {student.pinLoading ? (
                <LoadingSpinner size="small" />
              ) : student.showPin && student.pin_code ? (
                <>
                  <ModernButton 
                    size="small" 
                    variant="secondary"
                    onClick={() => copyToClipboard(student.user_id)}
                  >
                    Copy
                  </ModernButton>
                  <ModernButton 
                    size="small" 
                    variant="secondary"
                    onClick={() => regeneratePin(student.user_id)}
                  >
                    New PIN
                  </ModernButton>
                  <ModernButton 
                    size="small" 
                    variant="secondary"
                    onClick={() => togglePinDisplay(student.user_id)}
                  >
                    Hide
                  </ModernButton>
                </>
              ) : (
                <ModernButton 
                  size="small" 
                  variant="secondary"
                  onClick={() => togglePinDisplay(student.user_id)}
                >
                  Show Login Info
                </ModernButton>
              )}
              <ModernButton                 size="small"
                onClick={() => handleViewChats(student.user_id)}
                style={{ marginRight: '0.5rem' }}
              >
                Student Details
              </ModernButton>
              {student.archiving ? (
                <ModernButton size="small" disabled>
                  <LoadingSpinner size="small" /> Archiving...
                </ModernButton>
              ) : (
                <ArchiveButton
                  size="small"
                  onClick={() => openArchiveModal(student)}
                  variant="secondary"
                >
                  Archive
                </ArchiveButton>
              )}
              {student.deleting ? (
                <ModernButton size="small" disabled>
                  <LoadingSpinner size="small" /> Deleting...
                </ModernButton>
              ) : (
                <DeleteButton
                  size="small"
                  onClick={() => openDeleteModal(student)}
                  variant="secondary"
                >
                  Delete
                </DeleteButton>
              )}
            </MobileActions>
          </MobileCard>
        ))}
      </MobileList>
      {archiveModalOpen && studentToArchive && (
        <ConfirmationModal>
          <ModalContent>
            <h3>Archive Student</h3>
            <p>Are you sure you want to remove <strong>{studentToArchive.name}</strong> from this room?</p>
            <p>The student will no longer have access to this room, but their account and data will be preserved.</p>
            <ModalActions>
              <ModernButton variant="ghost" onClick={closeArchiveModal}>
                Cancel
              </ModernButton>
              <ArchiveButton 
                onClick={() => archiveStudent(studentToArchive.user_id)}
                variant="secondary"
              >
                Archive Student
              </ArchiveButton>
            </ModalActions>
          </ModalContent>
        </ConfirmationModal>
      )}
      {deleteModalOpen && studentToDelete && (
        <ConfirmationModal>
          <ModalContent>
            <h3>Delete Student</h3>
            <p>Are you sure you want to permanently delete <strong>{studentToDelete.name}</strong>?</p>
            <p style={{ color: 'red', fontWeight: 'bold' }}>⚠️ This action cannot be undone. The student's account and all associated data will be permanently deleted.</p>
            <ModalActions>
              <ModernButton variant="ghost" onClick={closeDeleteModal}>
                Cancel
              </ModernButton>
              <DeleteButton 
                onClick={() => deleteStudent(studentToDelete.user_id)}
                variant="secondary"
              >
                Delete Permanently
              </DeleteButton>
            </ModalActions>
          </ModalContent>
        </ConfirmationModal>
      )}
    </ListContainer>
  );
}