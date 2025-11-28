import { useState, useCallback, useEffect, useRef } from 'react';

const PVQ_TRIGGER_INTERVAL = 30 * 60;
const PVQ_RANDOM_OFFSET_MIN = 5 * 60;
const PVQ_RANDOM_OFFSET_MAX = 10 * 60;

export const usePVQTrigger = (options = {}) => {
  const {
    sessionTime = 0,
    getRandomQuestion = null,
    onPVQTriggered = null,
    onPVQSubmitted = null
  } = options;

  const [showPVQModal, setShowPVQModal] = useState(false);
  const [currentPVQQuestion, setCurrentPVQQuestion] = useState(null);
  const [pvqStartTime, setPVQStartTime] = useState(null);
  const [nextPVQTriggerTime, setNextPVQTriggerTime] = useState(calculateNextTriggerTime());
  const [pvqSubmitting, setPVQSubmitting] = useState(false);

  const pvqTriggeredRef = useRef(false);

  function calculateNextTriggerTime() {
    const randomOffset = Math.floor(
      Math.random() * (PVQ_RANDOM_OFFSET_MAX - PVQ_RANDOM_OFFSET_MIN) + PVQ_RANDOM_OFFSET_MIN
    );
    return PVQ_TRIGGER_INTERVAL + randomOffset;
  }

  const triggerPVQ = useCallback(async () => {
    if (!showPVQModal && getRandomQuestion) {
      try {
        setPVQSubmitting(false);
        const question = await getRandomQuestion();
        if (question) {
          setCurrentPVQQuestion(question);
          setShowPVQModal(true);
          setPVQStartTime(Date.now());

          if (onPVQTriggered) {
            onPVQTriggered(question);
          }
        }
      } catch (error) {
        console.error('Error triggering PVQ:', error);
      }
    }
  }, [showPVQModal, getRandomQuestion, onPVQTriggered]);

  const closePVQModal = useCallback(() => {
    setShowPVQModal(false);
    setCurrentPVQQuestion(null);
    setPVQStartTime(null);
    setPVQSubmitting(false);
    setNextPVQTriggerTime(calculateNextTriggerTime());
    pvqTriggeredRef.current = false;
  }, []);

  const submitPVQAnswer = useCallback(async (answer) => {
    if (!currentPVQQuestion) return;

    setPVQSubmitting(true);

    try {
      const timeToAnswer = pvqStartTime ? Date.now() - pvqStartTime : 0;

      if (onPVQSubmitted) {
        await onPVQSubmitted({
          question: currentPVQQuestion,
          answer,
          timeToAnswer
        });
      }

      setShowPVQModal(false);
      setCurrentPVQQuestion(null);
      setPVQStartTime(null);
      setPVQSubmitting(false);
      setNextPVQTriggerTime(calculateNextTriggerTime());
      pvqTriggeredRef.current = false;
    } catch (error) {
      console.error('Error submitting PVQ answer:', error);
      setPVQSubmitting(false);
    }
  }, [currentPVQQuestion, pvqStartTime, onPVQSubmitted]);

  useEffect(() => {
    if (
      sessionTime >= nextPVQTriggerTime &&
      !showPVQModal &&
      !pvqTriggeredRef.current
    ) {
      pvqTriggeredRef.current = true;
      triggerPVQ();
    }
  }, [sessionTime, nextPVQTriggerTime, showPVQModal, triggerPVQ]);

  return {
    showPVQModal,
    currentPVQQuestion,
    pvqStartTime,
    nextPVQTriggerTime,
    pvqSubmitting,
    triggerPVQ,
    closePVQModal,
    submitPVQAnswer
  };
};

export default usePVQTrigger;
