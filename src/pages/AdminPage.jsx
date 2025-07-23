import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import Papa from 'papaparse';
import { Upload, FileText, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setUploadStatus(null);
  };

  const handleUpload = () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const requiredColumns = ['id', 'category', 'challenge_id_text', 'title', 'description'];
        const headers = results.meta.fields;
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
          toast({
            title: 'Invalid CSV format',
            description: `Missing columns: ${missingColumns.join(', ')}. Required: 'id', 'category', 'challenge_id_text', 'title', 'description'`,
            variant: 'destructive',
          });
          setIsUploading(false);
          return;
        }

        const challenges = results.data.map(row => ({
          id: Number(row['id']),
          category: row['category'],
          challenge_id_text: row['challenge_id_text'],
          title: row['title'],
          description: row['description'],
        })).filter(c => c.id && c.category && c.title && c.description && c.challenge_id_text);

        if (challenges.length === 0) {
            toast({
                title: 'No valid data found',
                description: 'The CSV file is empty or contains no valid rows.',
                variant: 'destructive',
            });
            setIsUploading(false);
            return;
        }

        // Upsert using 'id' as the primary key
        const { error } = await supabase.from('challenges').upsert(challenges, { onConflict: 'id' });

        if (error) {
          setUploadStatus({ success: false, message: error.message });
          toast({
            title: 'Upload failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          setUploadStatus({ success: true, message: `Successfully processed ${challenges.length} challenges!` });
          toast({
            title: 'Upload successful!',
            description: `${challenges.length} challenges have been added or updated.`,
          });
          setFile(null);
        }
        setIsUploading(false);
      },
      error: (error) => {
        toast({
          title: 'Error parsing file',
          description: error.message,
          variant: 'destructive',
        });
        setIsUploading(false);
      },
    });
  };

  return (
    <div className="min-h-screen bg-sun-beige p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Button onClick={() => navigate('/profile')} variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2"/>
                Back to Profile
            </Button>
            <h1 className="text-4xl font-bold gradient-text">Admin Panel</h1>
            <p className="text-charcoal-gray/80 mt-1">Manage your application content.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/50 border-black/10 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl text-forest-green">Upload Challenges via CSV</CardTitle>
                    <CardDescription>
                        Select a CSV file with columns: <strong>Growth Area, Challenge ID, Challenge Text</strong>. Duplicates will be ignored.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-full">
                            <label htmlFor="file-upload" className="sr-only">Choose file</label>
                            <Input
                                id="file-upload"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                disabled={isUploading}
                                className="cursor-pointer"
                            />
                        </div>
                        <Button onClick={handleUpload} disabled={!file || isUploading}>
                            <Upload className="w-4 h-4 mr-2" />
                            {isUploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </div>
                    {file && (
                        <div className="flex items-center p-3 bg-leaf-green/10 rounded-lg border border-leaf-green/30">
                            <FileText className="w-6 h-6 text-leaf-green mr-3" />
                            <span className="font-medium text-charcoal-gray">{file.name}</span>
                        </div>
                    )}
                    {uploadStatus && (
                         <div className={`flex items-center p-3 rounded-lg border ${uploadStatus.success ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                            {uploadStatus.success ? <CheckCircle className="w-6 h-6 text-green-600 mr-3" /> : <XCircle className="w-6 h-6 text-red-600 mr-3" />}
                            <span className={`font-medium ${uploadStatus.success ? 'text-green-800' : 'text-red-800'}`}>{uploadStatus.message}</span>
                         </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage;