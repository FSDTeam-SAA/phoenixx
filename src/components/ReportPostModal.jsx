import { useReportMutation } from '@/features/report/reportApi';
import { ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Modal, Radio } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { isAuthenticated } from '../../utils/auth';
import { ThemeContext } from '../app/ClientLayout';
import { useReportCommentMutation } from '../features/comments/commentApi';

const { TextArea } = Input;

const ReportPostModal = ({ isOpen, onClose, postId, commentId, title }) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [selectedReason, setSelectedReason] = useState('');
  const [report, { isLoading }] = useReportMutation();
  const [reportComment, { isLoading: reportCommentLoading }] = useReportCommentMutation();
  const [successMessage, setSuccessMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { isDarkMode } = useContext(ThemeContext);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Set the reported URL based on whether it's a post or comment
      const reportedUrl = postId ? `/posts/${postId}` : `/comments/${commentId}`;
      form.setFieldsValue({
        reportedUrl,
      });
      // Reset success states when modal opens
      setSuccessMessage('');
      setIsSuccess(false);
    }
  }, [isOpen, postId, commentId, form]);

  const handleSubmit = async () => {
    if (!isAuthenticated()) {
      toast.error('please login first then send report');
      return;
    }

    try {
      const values = await form.validateFields();

      if (postId) {
        // Handle post report
        const reason = {
          reason: values.reportReason,
          description: values.message,
          postId: postId
        };
        const response = await report(reason).unwrap();
        setSuccessMessage(response?.message || 'Report submitted successfully!');
        setIsSuccess(true);
      } else if (commentId) {
        // Handle comment report
        const reason = {
          reason: values.reportReason,
          description: values.message,
          commentId: commentId
        };
        const response = await reportComment(reason).unwrap();
        setSuccessMessage(response?.message || 'Report submitted successfully!');
        setIsSuccess(true);
      }

      form.resetFields();
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      setSuccessMessage('Failed to submit report. Please try again later.');
      setIsSuccess(false);
      console.error('Report submission failed:', error);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setSuccessMessage('');
    setIsSuccess(false);
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <ExclamationCircleOutlined className="text-red-500 text-2xl" />
          <span className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Report {title}
          </span>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={650}
      destroyOnClose
      centered
      className={`report-modal ${isDarkMode ? 'dark-modal' : ''}`}
      styles={{
        content: {
          backgroundColor: isDarkMode ? '#1f2937' : '#fff',
        },
        header: {
          backgroundColor: isDarkMode ? '#1f2937' : '#fff',
          borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #f0f0f0',
        },
      }}
    >
      {/* Success/Error message inside the modal */}
      {successMessage && (
        <Alert
          message={successMessage}
          type={isSuccess ? 'success' : 'error'}
          showIcon
          className="mb-4"
          style={{
            backgroundColor: isDarkMode ? '#111827' : undefined,
            borderColor: isDarkMode ? '#374151' : undefined,
          }}
        />
      )}

      {!isSuccess && (
        <>
          <div className={`mb-6 leading-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <Alert
              message={
                <span className="text-sm">
                  Help us maintain a safe community by reporting content that violates our{' '}
                  <Link
                    href="/terms-conditions"
                    className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline font-medium`}
                  >
                    Terms of Service
                  </Link>.
                  All reports are confidential.
                </span>
              }
              type="info"
              showIcon
              icon={<InfoCircleOutlined className={isDarkMode ? "text-blue-400" : "text-blue-500"} />}
              className="mb-4"
              style={{
                backgroundColor: isDarkMode ? '#111827' : undefined,
                borderColor: isDarkMode ? '#374151' : undefined,
              }}
            />
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              reportReason: '',
              message: ''
            }}
          >
            <Form.Item
              name="reportedUrl"
              hidden
            >
              <Input type="hidden" />
            </Form.Item>

            <Form.Item
              name="reportReason"
              label={<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Reason for reporting
              </span>}
              rules={[{ required: true, message: 'Please select a reason for reporting' }]}
            >
              <Radio.Group
                className="flex flex-col gap-4"
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                onChange={(e) => setSelectedReason(e.target.value)}
              >
                <Radio value="rude" className="block">
                  <span className={`font-medium ${isDarkMode ? 'text-gray-300' : ''}`}>
                    Rude or vulgar content
                  </span>
                </Radio>
                <Radio value="harassment" className="block">
                  <span className={`font-medium ${isDarkMode ? 'text-gray-300' : ''}`}>
                    Harassment or hate speech
                  </span>
                </Radio>
                <Radio value="spam" className="block">
                  <span className={`font-medium ${isDarkMode ? 'text-gray-300' : ''}`}>
                    Spam or copyright issue
                  </span>
                </Radio>
                <Radio value="inappropriate" className="block">
                  <span className={`font-medium ${isDarkMode ? 'text-gray-300' : ''}`}>
                    Inappropriate content
                  </span>
                </Radio>
                <Radio value="other" className="block">
                  <span className={`font-medium ${isDarkMode ? 'text-gray-300' : ''}`}>
                    Other issue
                  </span>
                </Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label={<span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Additional details
              </span>}
              name="message"
              extra={
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Please provide specific details to help us investigate.
                </span>
              }
            >
              <TextArea
                rows={5}
                placeholder="Describe the issue in detail..."
                className={`${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400 hover:border-blue-400 focus:border-blue-500' : 'border-gray-300 hover:border-blue-400 focus:border-blue-500'}`}
                showCount
                maxLength={500}
              />
            </Form.Item>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                onClick={handleClose}
                className="px-6 h-10"
                style={isDarkMode ? { color: '#e5e7eb', borderColor: '#4b5563', backgroundColor: '#1f2937' } : {}}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={isLoading || reportCommentLoading}
                className="px-6 h-10 bg-primary font-medium"
              >
                Submit Report
              </Button>
            </div>
          </Form>
        </>
      )}
    </Modal>
  );
};

export default ReportPostModal;