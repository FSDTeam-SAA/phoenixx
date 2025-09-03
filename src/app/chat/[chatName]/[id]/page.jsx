'use client'
import React, { use } from 'react';
import ChatWindow from '../../Component/ChatWindow';

const Page = ({ params }) => {
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  // console.log(resolvedParams.id);

  return (
    <div>
      <ChatWindow id={resolvedParams.id} />
    </div>
  );
};

export default Page;