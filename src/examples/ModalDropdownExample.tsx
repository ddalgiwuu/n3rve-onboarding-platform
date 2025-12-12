import { useState } from 'react';
import { ModalWrapper } from '../components/Modal/ModalWrapper';
import { PortalDropdown, DropdownItem, DropdownDivider } from '../components/Dropdown/PortalDropdown';

/**
 * Complete example demonstrating Modal and Portal Dropdown usage
 */
export function ModalDropdownExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div style={{ padding: '40px' }}>
      <h1>Modal & Portal Dropdown Examples</h1>

      {/* Example 1: Basic Modal */}
      <section style={{ marginBottom: '40px' }}>
        <h2>1. Viewport-Centered Modal</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Open Modal
        </button>

        <ModalWrapper
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          closeOnEscape
          closeOnBackdrop
        >
          <div>
            <h2 style={{ marginTop: 0 }}>Modal Title</h2>
            <p>This modal is always centered in the viewport using flexbox.</p>
            <p>Features:</p>
            <ul>
              <li>100% viewport centered (regardless of scroll position)</li>
              <li>Prevents body scroll when open</li>
              <li>ESC key to close</li>
              <li>Click backdrop to close</li>
              <li>Focus management</li>
              <li>Portal rendering (no z-index issues)</li>
            </ul>

            {/* Dropdown inside Modal - demonstrates z-index isolation */}
            <PortalDropdown
              trigger={
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Open Dropdown (Portal inside Modal)
                </button>
              }
            >
              <DropdownItem onClick={() => alert('Edit clicked')}>Edit</DropdownItem>
              <DropdownItem onClick={() => alert('Duplicate clicked')}>
                Duplicate
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem onClick={() => alert('Delete clicked')}>Delete</DropdownItem>
            </PortalDropdown>

            <div style={{ marginTop: '20px' }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close Modal
              </button>
            </div>
          </div>
        </ModalWrapper>
      </section>

      {/* Example 2: Portal Dropdown */}
      <section style={{ marginBottom: '40px' }}>
        <h2>2. Portal Dropdown (Left Aligned)</h2>
        <PortalDropdown
          trigger={
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Actions
            </button>
          }
          align="left"
          closeOnScroll={true}
        >
          <DropdownItem onClick={() => console.log('View clicked')}>
            View Details
          </DropdownItem>
          <DropdownItem onClick={() => console.log('Edit clicked')}>
            Edit Item
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem onClick={() => console.log('Archive clicked')}>
            Archive
          </DropdownItem>
          <DropdownItem onClick={() => console.log('Delete clicked')}>
            Delete
          </DropdownItem>
        </PortalDropdown>
      </section>

      {/* Example 3: Right-aligned Dropdown */}
      <section style={{ marginBottom: '40px' }}>
        <h2>3. Right-Aligned Dropdown</h2>
        <div style={{ textAlign: 'right' }}>
          <PortalDropdown
            trigger={
              <button
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                User Menu
              </button>
            }
            align="right"
            closeOnScroll={false}
          >
            <div style={{ padding: '12px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              <strong>user@example.com</strong>
            </div>
            <DropdownItem onClick={() => console.log('Profile')}>Profile</DropdownItem>
            <DropdownItem onClick={() => console.log('Settings')}>Settings</DropdownItem>
            <DropdownDivider />
            <DropdownItem onClick={() => console.log('Logout')}>Logout</DropdownItem>
          </PortalDropdown>
        </div>
      </section>

      {/* Scroll demonstration area */}
      <section>
        <h2>4. Scroll Test Area</h2>
        <p>Scroll down to test modal centering behavior</p>
        <div style={{ height: '1500px', backgroundColor: '#f3f4f6', padding: '20px' }}>
          <p>Content area for scroll testing...</p>
          <div style={{ position: 'absolute', top: '1000px' }}>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Open Modal (Scroll Test)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ModalDropdownExample;