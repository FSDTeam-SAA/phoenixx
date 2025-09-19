"use client";
import { useGetProfileQuery, useUpdateProfileMutation } from '@/features/profile/profileApi';
import { InfoCircleOutlined, LockOutlined } from '@ant-design/icons';
import { Alert, Button, Col, Form, Grid, Input, message, Modal, Row, Tooltip, Upload } from 'antd';
import { useContext, useEffect, useState } from 'react';
import { getImageUrl } from '../../../utils/getImageUrl';
import { ThemeContext } from '../../app/ClientLayout';
import Loading from '../Loading/Loading';

const ProfileBanner = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const { data, error, isLoading: profileLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: updateProfileLoading }] = useUpdateProfileMutation();

  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const isSmallMobile = screens.xs;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [remainingChanges, setRemainingChanges] = useState(0);
  const [isUsernameReadOnly, setIsUsernameReadOnly] = useState(false);

  // Bio character limit
  const BIO_MAX_LENGTH = 200;

  // Watch bio field for real-time updates
  const bioValue = Form.useWatch('bio', form) || '';

  useEffect(() => {
    if (data?.data) {
      const changesLeft = data.data.maxChangeUserName || 0;
      setRemainingChanges(changesLeft);
      setIsUsernameReadOnly(changesLeft <= 0);

      if (isModalOpen) {
        form.setFieldsValue({
          fullName: data.data.name || '',
          userName: data.data.userName || '',
          email: data.data.email,
          contact: data.data.contact || '',
          bio: data.data.bio || '',
        });
      }
    }
  }, [data, isModalOpen, form]);

  const showModal = () => {
    setFileList([]);
    if (data?.data) {
      const changesLeft = data.data.maxChangeUserName || 0;
      setRemainingChanges(changesLeft);
      setIsUsernameReadOnly(changesLeft <= 0);

      form.setFieldsValue({
        fullName: data.data.name || '',
        userName: data.data.userName || '',
        email: data.data.email,
        contact: data.data.contact || '',
        bio: data.data.bio || '',
      });
    }
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'unset';
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();

      const formData = new FormData();

      // Always include fullName and bio if provided
      if (values.fullName) formData.append('name', values.fullName.trim());
      if (values.bio) formData.append('bio', values.bio.trim());

      // Always include image if provided
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('image', fileList[0].originFileObj);
      }

      // Check for updates
      const hasImageUpdate = fileList.length > 0 && fileList[0].originFileObj;
      const hasContactUpdate = values.contact !== (data?.data?.contact || '');
      const hasNameUpdate = values.fullName !== (data?.data?.name || '');
      const hasBioUpdate = values.bio !== (data?.data?.bio || '');

      if (!hasImageUpdate && !hasContactUpdate && !hasNameUpdate && !hasBioUpdate) {
        message.info({
          content: "No changes detected to update",
          duration: 3,
        });
        return;
      }

      const response = await updateProfile(formData).unwrap();

      if (response.success) {
        message.success("Profile updated successfully!");
        setIsModalOpen(false);
        document.body.style.overflow = 'unset';
      } else {
        message.error(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Update error:", error);
      message.error(error.data?.message || "Failed to update profile");
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    fileList,
    maxCount: 1,
    listType: isSmallMobile ? 'picture' : 'picture-card',
    accept: 'image/*'
  };

  if (profileLoading) {
    return (
      <div className={`pt-16 md:pt-20 pb-8 md:pb-10 flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-[#EBEBFF]'}`}>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`pt-16 md:pt-20 pb-8 md:pb-10 flex items-center justify-center ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-[#EBEBFF] text-gray-800'}`}>
        Error loading profile
      </div>
    );
  }

  return (
    <div className={`pt-16 md:pt-20 pb-8 md:pb-10 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
      <div className="container mx-auto px-4">
        <div className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
          {/* Banner Content */}
          <div className="relative pt-8 md:pt-10 pb-4 px-4 sm:px-6">
            {/* Profile Picture */}
            <div className="absolute left-1/2 transform -translate-x-1/2 -top-10 md:-top-12">
              <div className="relative">
                <div className={`w-16 h-16 sm:w-22 sm:h-22 md:w-32 md:h-32 rounded-full overflow-hidden border-4 ${isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-300 border-white'}`}>
                  <img
                    src={getImageUrl(data?.data?.profile)}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div className={`flex ${isMobile ? 'justify-center mt-8 md:mt-4' : 'justify-end'}`}>
              <button
                onClick={showModal}
                className={`
                  ${isSmallMobile ? 'px-3 py-1.5 text-xs' : isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-base'} 
                  bg-[#1C37E0] hover:bg-[#1530C7] transition-colors cursor-pointer
                  text-white flex items-center justify-center gap-2
                  rounded-md shadow-sm border-none
                `}
                aria-label="Edit profile"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={isSmallMobile ? "16" : isMobile ? "18" : "20"}
                  height={isSmallMobile ? "16" : isMobile ? "18" : "20"}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.99952 10L3.84252 16.162C3.60992 16.3944 3.43819 16.6805 3.34252 16.995L2.02052 21.355C1.9943 21.4415 1.99202 21.5335 2.01392 21.6212C2.03583 21.7089 2.08109 21.789 2.1449 21.853C2.20871 21.917 2.28869 21.9626 2.37631 21.9847C2.46394 22.0069 2.55593 22.0049 2.64252 21.979L7.00052 20.656C7.31399 20.5599 7.59902 20.3882 7.83052 20.156L13.9995 13.982" />
                  <path d="M12.8291 7.17153L17.1881 2.82553C17.4498 2.5638 17.7605 2.35619 18.1025 2.21455C18.4445 2.0729 18.811 2 19.1811 2C19.5512 2 1.9177 2.0729 20.2597 2.21455C20.6017 2.35619 20.9124 2.5638 21.1741 2.82553C21.4358 3.08725 21.6434 3.39796 21.7851 3.73992C21.9267 4.08188 21.9996 4.44839 21.9996 4.81853C21.9996 5.18866 21.9267 5.55517 21.7851 5.89713C21.6434 6.23909 21.4358 6.5498 21.1741 6.81153L16.8211 11.1645" />
                  <path d="M15 5L19 9" />
                  <path d="M2 2L22 22" />
                </svg>
                <span className="font-medium">Edit Profile</span>
              </button>
            </div>

            {/* User Info */}
            <div className="text-center pb-5 pt-4 md:pt-0">
              <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {data?.data?.name}
              </h2>
              {data?.data?.userName && (
                <p className={`text-sm md:text-base font-medium mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  @{data.data.userName}
                </p>
              )}
              {data?.data?.bio && (
                <p className={`text-sm md:text-base font-serif w-full md:w-10/12 lg:w-8/12 xl:w-6/12 mx-auto mt-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {data.data.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        title={<span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Edit Profile Information</span>}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        centered
        width={isSmallMobile ? "95%" : isMobile ? "90%" : 700}
        className={isDarkMode ? 'dark-modal' : ''}
        styles={{
          header: {
            borderBottom: isDarkMode ? '1px solid #424242' : '1px solid #f0f0f0',
            backgroundColor: isDarkMode ? '#374151' : '#ffffff'
          },
          body: {
            padding: isSmallMobile ? '12px' : isMobile ? '16px' : '24px',
            backgroundColor: isDarkMode ? '#374151' : '#ffffff'
          },
          content: {
            backgroundColor: isDarkMode ? '#374151' : '#ffffff'
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          className={isDarkMode ? 'dark-form' : ''}
        >
          {/* Username Change Limit Alert */}
          {remainingChanges <= 0 && (
            <Alert
              message="Username Change Limit Reached"
              description="You've used all your username changes. You can still update your profile picture and other information."
              type="info"
              icon={<InfoCircleOutlined />}
              showIcon
              className={`mb-4 ${isDarkMode ? 'bg-blue-900/20 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'}`}
              style={{
                backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
                borderColor: isDarkMode ? '#1d4ed8' : '#93c5fd',
                color: isDarkMode ? '#dbeafe' : '#1e40af'
              }}
            />
          )}

          {/* Profile Picture Upload */}
          <Form.Item label={<span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Profile Picture</span>}>
            <Row gutter={[16, 16]} align="middle">
              {fileList.length === 0 && (
                <Col xs={24} sm={8} md={6}>
                  <div className="flex justify-center">
                    <img
                      src={getImageUrl(data?.data?.profile)}
                      alt="Current profile"
                      className={`w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full border-2 ${isDarkMode ? 'border-gray-500' : 'border-gray-300'}`}
                    />
                  </div>
                  <div className={`text-xs mt-1 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Current profile
                  </div>
                </Col>
              )}

              <Col xs={24} sm={fileList.length === 0 ? 16 : 24} md={fileList.length === 0 ? 18 : 24}>
                <Upload {...uploadProps}>
                  {fileList.length === 0 && (
                    <div className={`p-2 sm:p-4 rounded-lg border-2 border-dashed transition-colors hover:border-blue-500 ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-50 border-gray-300 text-gray-600'}`}>
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-lg mb-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={isDarkMode ? 'text-white' : 'text-gray-400'}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </span>
                        <div className={`text-xs sm:text-sm text-center ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
                          {isSmallMobile ? 'Upload' : isMobile ? 'Upload Photo' : 'Upload Profile Picture'}
                        </div>
                      </div>
                    </div>
                  )}
                </Upload>
              </Col>
            </Row>
          </Form.Item>

          {/* Full Name */}
          <Form.Item
            name="fullName"
            label={<span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Full Name</span>}
            rules={[
              { required: true, message: 'Please enter your full name' },
              { min: 2, message: 'Full name must be at least 2 characters' },
              { max: 50, message: 'Full name must be 50 characters or less' },
              {
                pattern: /^[a-zA-Z\s\-']+$/,
                message: 'Full name can only contain letters, spaces, hyphens, and apostrophes'
              },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const parts = value.trim().split(/\s+/);
                  if (parts.length < 2) {
                    return Promise.reject(new Error('Enter both first and last name'));
                  }
                  const invalidCaps = parts.filter(part => part && !/^[A-Z]/.test(part));
                  if (invalidCaps.length > 0) {
                    return Promise.reject(new Error('Each name should start with a capital letter'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input
              placeholder="John Doe"
              size={isSmallMobile ? 'small' : isMobile ? 'middle' : 'large'}
              className={isDarkMode ? 'bg-gray-600 text-white border-gray-500 placeholder-gray-400' : 'bg-white text-gray-900 border-gray-300'}
            />
          </Form.Item>

          {/* Username (Read Only) */}
          <Form.Item
            name="userName"
            label={
              <div className="flex items-center gap-2">
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Username</span>
                <Tooltip title="Username cannot be changed">
                  <LockOutlined className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </Tooltip>
              </div>
            }
          >
            <Input
              disabled
              className={isDarkMode ? 'bg-gray-600 text-gray-300 border-gray-500' : 'bg-gray-100 text-gray-500 border-gray-300'}
              size={isSmallMobile ? 'small' : isMobile ? 'middle' : 'large'}
            />
          </Form.Item>

          {/* Bio */}
          <Form.Item
            name="bio"
            label={<span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Bio</span>}
            extra={
              <span
                className={
                  bioValue?.length > BIO_MAX_LENGTH - 10
                    ? 'text-red-500'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }
              >
                {BIO_MAX_LENGTH - (bioValue?.length || 0)} characters left
              </span>
            }
          >
            <Input.TextArea
              placeholder="Tell us about yourself..."
              maxLength={BIO_MAX_LENGTH}
              autoSize={{ minRows: 2, maxRows: 4 }}
              className={isDarkMode ? 'bg-gray-600 text-white border-gray-500 placeholder-gray-400' : 'bg-white text-gray-900 border-gray-300'}
              size={isSmallMobile ? 'small' : isMobile ? 'middle' : 'large'}
            />
          </Form.Item>

          {/* Email (Read Only) */}
          <Form.Item
            name="email"
            label={
              <div className="flex items-center gap-2">
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Email</span>
                <Tooltip title="Email cannot be changed">
                  <LockOutlined className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </Tooltip>
              </div>
            }
          >
            <Input
              disabled
              className={isDarkMode ? 'bg-gray-600 text-gray-300 border-gray-500' : 'bg-gray-100 text-gray-500 border-gray-300'}
              size={isSmallMobile ? 'small' : isMobile ? 'middle' : 'large'}
            />
          </Form.Item>

          {/* Update Button */}
          <Form.Item>
            <Button
              type="primary"
              block
              onClick={handleUpdate}
              loading={updateProfileLoading}
              size={isSmallMobile ? 'small' : isMobile ? 'middle' : 'large'}
              style={{
                backgroundColor: '#1C37E0',
                borderColor: '#1C37E0',
                height: isSmallMobile ? '36px' : isMobile ? '40px' : '44px',
                marginTop: '8px'
              }}
              className="hover:bg-[#1530C7] hover:border-[#1530C7] transition-colors"
            >
              {updateProfileLoading ? 'Updating...' : 'Update Profile'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Dark Mode Styles */}
      <style jsx>{`
        .dark-modal .ant-modal-content { background-color: #374151 !important; }
        .dark-modal .ant-modal-header { background-color: #374151 !important; border-bottom: 1px solid #4B5563 !important; }
        .dark-modal .ant-modal-close { color: #ffffff !important; }
        .dark-form .ant-form-item-label > label { color: #ffffff !important; }
        .dark-form .ant-upload { background-color: #4B5563 !important; border-color: #6B7280 !important; }
        .dark-form .ant-alert { background-color: rgba(59, 130, 246, 0.1) !important; border-color: #1d4ed8 !important; }
        .dark-form .ant-alert-message { color: #dbeafe !important; }
      `}</style>
    </div>
  );
};

export default ProfileBanner;