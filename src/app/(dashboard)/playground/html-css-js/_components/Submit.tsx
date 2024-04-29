"use client";

import { useState } from "react";
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import axios from "axios";
import usePlaygroundContext from "@/hooks/usePlaygroundContext";

const Submit = ({
  user,
  assignmentDetails,
  isLoading,
}: {
  user: any,
  assignmentDetails: any,
  isLoading?: boolean
}) => {

  const [isSubmitting, setSubmitting] = useState(false);
  const { files } = usePlaygroundContext();

  const handleSubmit = async () => {
    if (!user || !user.username || !user.email || !assignmentDetails || !assignmentDetails.title) {
      toast.error('Error submitting assignment');
      return;
    }

    try {
      setSubmitting(true);
      toast.loading('Submitting assignment');

      const filePaths: string[] = [];
      const newFiles: { [key: string]: string } = {};

      files.forEach((file, index) => {
        const filePath = `assignments/${user.username}/${assignmentDetails.title}/${file.filePath}`;
        filePaths.push(filePath);
        newFiles[filePath] = file.code;
      });

      const submission = await axios.post(`/api/assignment/submit`, {
        assignmentDetails,
        files:newFiles,
      });
      toast.dismiss();
      toast.success('Assignment submitted successfully');
    } catch (e) {
      toast.dismiss();
      toast.error('Error submitting assignment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button disabled={isLoading || isSubmitting} className="w-full" variant="outline" onClick={handleSubmit} >
      Submit
    </Button>
  );
};

export default Submit;
