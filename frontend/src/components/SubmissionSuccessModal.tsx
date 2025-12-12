import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Megaphone, FolderOpen, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubmissionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId?: string;
  albumTitle?: string;
  artistName?: string;
}

export default function SubmissionSuccessModal({
  isOpen,
  onClose,
  submissionId,
  albumTitle = 'Your Release',
  artistName = 'Artist'
}: SubmissionSuccessModalProps) {
  const navigate = useNavigate();

  const handleMarketingSubmission = () => {
    if (submissionId) {
      navigate(`/marketing-submission/${submissionId}`);
    } else {
      navigate('/release-projects');
    }
    onClose();
  };

  const handleViewProjects = () => {
    navigate('/release-projects');
    onClose();
  };

  const handleNewSubmission = () => {
    navigate('/release-submission-modern');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Success Icon */}
              <div className="flex flex-col items-center pt-8 pb-6 px-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg"
                >
                  <CheckCircle className="w-12 h-12 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                  릴리즈 제출 완료!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-2">
                  Release Submitted Successfully!
                </p>

                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl w-full">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    <span className="font-semibold">앨범:</span> {albumTitle}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">아티스트:</span> {artistName}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-8 pb-8 space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMarketingSubmission}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Megaphone className="w-5 h-5" />
                  <span>마케팅 작업 시작하기 / Start Marketing Workflow</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleViewProjects}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-all duration-300"
                >
                  <FolderOpen className="w-5 h-5" />
                  <span>릴리즈 프로젝트 보기 / View Release Projects</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNewSubmission}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-all duration-300"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>새 릴리즈 제출하기 / Submit Another Release</span>
                </motion.button>
              </div>

              {/* Footer Note */}
              <div className="px-8 pb-6">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  💡 Tip: 마케팅 작업을 완료하면 더 많은 플레이리스트 추천 기회를 얻을 수 있습니다!
                  <br />
                  Complete marketing tasks to increase your playlist pitching opportunities!
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
