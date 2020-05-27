import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { dobValidity, futureDateValidity } from './dateValidity';
import Question from './Question/Question';
import Arrow from './Arrow';
import { ProgressBar } from 'baseui/progress-bar';
import { Card } from 'baseui/card';

const Flow = ({
   flowData,
   userHistory,
   answers,
   resumeFlowQuestionKey,
   userIsMarried,
   updateAnswersHandler,
   finishFlowHandler,
   updateUserData,
}) => {
   const [questionKeys, setQuestionKeys] = useState();
   const [currentQuestionKey, setCurrentQuestionKey] = useState();
   const [currentQuestion, setCurrentQuestion] = useState();
   const [history, setHistory] = useState();

   const [nextButtonDisabled, setNextButtonDisabled] = useState(true);
   const [nextArrowMessage, setNextArrowMessage] = useState('Next Question');

   const updateInput = target => {
      let isMarried = userIsMarried;
      let { name, value } = target;
      if (value === 'true') value = true;
      if (value === 'false') value = false
      if (name === 'married') isMarried = value;
      if(!isNaN(+value) && typeof value !== 'boolean') value = +value;
      updateAnswersHandler(currentQuestion.user, name, value);
      updateUI(currentQuestionKey, questionKeys, value, currentQuestion, flowData, isMarried);
   }

   const generateQuestionKeys = flowData => {
      let types = ['questions', 'spouseQuestions'];
      return types.reduce((stringArr, type) => {
         stringArr.push(...flowData[type].reduce((acc, q, i) => {
            function deepIterator(string, question, index) {
               let str = string ? string : `${type}.${index}`;
               acc.push(str);
               function treeIterator(questionOption) {
                  if (question.hasOwnProperty(questionOption)) {
                     question[questionOption].forEach((subQuestion, ind) => {
                        let x = deepIterator(str + `.${questionOption}.${ind}`, subQuestion, ind);
                        if (x) acc.push(x);
                     });
                  }
               }
               treeIterator('yesQuestions');
               treeIterator('noQuestions');
            }
            let x2 = deepIterator(undefined, q, i);
            if (x2) acc.push(x2);
            return acc;
         }, []));
         return stringArr;
      }, []);
   }

   const getQuestionFromKey = (input, flowData) => {
      let question = flowData;
      const keys = input.split('.');
      keys.forEach(key => {
         key = isNaN(+key) ? key : +key;
         question = question[key];
      });
      return question;
   }

   const getAnswer = (question, answers) => 
      question.user === 'user' ? answers[question.id] : (answers.spouse && answers.spouse[question.id]);

   const getProgressBarPercentage = (questionKeys, questionKey, isMarried) => {
      questionKeys = questionKeys.filter(question => isMarried ? question : question.split('.')[0] !== 'spouseQuestions');
      const percentage = (questionKeys.indexOf(questionKey) / questionKeys.length) * 100;
      return percentage;
   }

   const getNextQuestionKey = (question, questionKey, questionKeys, answer, isMarried) => {
      const depth = questionKey.split('.').length - 1;
      const lastUserQuestionKey = questionKeys.filter(key =>
         key.split('.')[0] !== 'spouseQuestions'
      ).slice(-1)[0];
      const lastBaseQuestionKey = questionKeys.filter(key =>
         key.split('.').length === 2 &&
         key.split('.')[0] !== 'spouseQuestions'
      ).slice(-1)[0];

      if (question.fieldType === 'boolean') {
         if (answer === true && question.hasOwnProperty('yesQuestions')) return `${questionKey}.yesQuestions.0`;
         if (answer === false && question.hasOwnProperty('noQuestions')) return `${questionKey}.noQuestions.0`;
      }
      if (isMarried && (lastUserQuestionKey === questionKey || lastBaseQuestionKey === questionKey)) {
         return `spouseQuestions.0`;
      } else if (depth === 1) {
         return `${questionKey.slice(0, -1)}${+questionKey.slice(-1) + 1}`;
      } else {
         let traversalKey = +questionKey.slice(-1);
         let nextKey = `${questionKey.slice(0, -1)}${traversalKey + 1}`;
         if (questionKeys.indexOf(nextKey) === -1) {
            nextKey = `${nextKey.split('.').slice(0, -2).join('.')}`;
            traversalKey = +nextKey.slice(-1);
            nextKey = `${nextKey.slice(0, -1)}${++traversalKey}`;
         }
         return nextKey;
      }
   }

   const updateUI = (questionKey, questionKeys, value, question, flowData, isMarried) => {
      const onLastQuestion = isOnLastQuestion(questionKey, questionKeys, value, flowData, isMarried);
      setNextArrowMessage(onLastQuestion ? 'Finish' : 'Next Question');
      setNextButtonDisabled(
         isNextButtonDisabled(value, question)
      );
   }

   const isOnLastQuestion = (currentQuestionKey, keys, answer, flowData, isMarried) => {
      const currentQuestion = getQuestionFromKey(currentQuestionKey, flowData);
      const lastBaseQuestionKey = keys.filter(key =>
         key.split('.').length === 2 &&
         key.split('.')[0] !== 'spouseQuestions'
      ).slice(-1)[0];
      const lastUserQuestionKey = keys.filter(key =>
         key.split('.')[0] !== 'spouseQuestions'
      ).slice(-1)[0];
      const lastBaseSpouseQuestionKey = keys.filter(key =>
         key.split('.').length === 2
      ).slice(-1)[0];
      const lastSpouseQuestionKey = keys[keys.length - 1];

      if (currentQuestionKey === lastSpouseQuestionKey) return true;
      if (!isMarried && currentQuestionKey === lastUserQuestionKey) return true;
      if (currentQuestionKey === lastBaseQuestionKey && !isMarried) {
         if (!currentQuestion.hasOwnProperty('yesQuestions') && answer === true) return true;
         if (!currentQuestion.hasOwnProperty('noQuestions') && answer === false) return true;
      }
      if (currentQuestionKey === lastBaseSpouseQuestionKey) {
         if (!currentQuestion.hasOwnProperty('yesQuestions') && answer === true) return true;
         if (!currentQuestion.hasOwnProperty('noQuestions') && answer === false) return true;
      }
      return false;
   }

   const isNextButtonDisabled = (value, question) => {
      const fieldType = question.fieldType;
      if (fieldType === 'string') {
         if (value && value.length >= 2) return false;
      } else if (fieldType === 'number') {
         if (value) return false;
      } else if (fieldType === 'boolean') {
         if (value !== undefined) return false;
      } else if (fieldType === 'date') {
         if (question.id === 'dob') {
            if (dobValidity(value)) return false;
         } else if (question.id === 'retireDate' || question.id === 'takeYear') {
            if (futureDateValidity(value, 90)) return false;
         }
      }
      return true;
   }

   const goToPreviousQuestion = () => {
      const previousQuestionKey = history[history.indexOf(currentQuestionKey) - 1];
      const previousQuestion = getQuestionFromKey(previousQuestionKey, flowData);
      const previousQuestionAnswer = getAnswer(previousQuestion, answers)
      setCurrentQuestionKey(previousQuestionKey);
      setCurrentQuestion(previousQuestion);
      updateUI(previousQuestionKey, questionKeys, previousQuestionAnswer, previousQuestion, flowData);
      setHistory(prevHistory => prevHistory.slice(0, -1));
   }

   const goToNextQuestion = () => {
      const onLastQuestion = isOnLastQuestion(currentQuestionKey,
         questionKeys,
         getAnswer(currentQuestion, answers),
         flowData,
         userIsMarried);

      if (onLastQuestion) {
         finishFlowHandler(currentQuestion);
      } else {
         const nextQuestionKey = getNextQuestionKey(currentQuestion, currentQuestionKey, questionKeys, getAnswer(currentQuestion, answers), userIsMarried);
         const nextQuestion = getQuestionFromKey(nextQuestionKey, flowData);
         const nextHistoryIndex = history.indexOf(nextQuestionKey);
         setCurrentQuestionKey(nextQuestionKey);
         setCurrentQuestion(nextQuestion);
         updateUI(nextQuestionKey, questionKeys, getAnswer(nextQuestion, answers), nextQuestion, flowData);
         if (nextHistoryIndex === -1) setHistory([...history, nextQuestionKey]);
         updateUserData({
            currentQuestion,
            currentQuestionKey,
            answers,
            history,
            currentFlow: flowData.id
         });
      }
   };

   useEffect(() => {
      setHistory(userHistory ? userHistory : ['questions.0']);
      const generatedQuestionKeys = generateQuestionKeys(flowData);
      const currentQuestionKey = resumeFlowQuestionKey ? resumeFlowQuestionKey : 'questions.0';
      const currentQuestion = getQuestionFromKey(currentQuestionKey, flowData)
      setCurrentQuestionKey(currentQuestionKey);
      setCurrentQuestion(currentQuestion);
      setQuestionKeys(generatedQuestionKeys);
      updateUI(currentQuestionKey, generatedQuestionKeys, getAnswer(currentQuestion, answers), currentQuestion, flowData);
   }, [flowData]);

   if (currentQuestion) {
      const { text, user } = currentQuestion;
      const fieldValue = getAnswer(currentQuestion, answers);
      const propsBundle = {
         ...currentQuestion,
         updateInput,
         fieldValue,
      }

      return (
         <Card data-testid='questionTitle' title={text}>
            <Question {...propsBundle} />
            <div style={{ display: 'flex' }}>
               <Arrow
                  action={goToPreviousQuestion}
                  disabled={currentQuestionKey === 'questions.0' ? true : false}
                  type='left'
               />
               <Arrow
                  message={nextArrowMessage}
                  action={goToNextQuestion}
                  disabled={nextButtonDisabled}
                  type='right'
               />
            </div>
            <ProgressBar value={getProgressBarPercentage(questionKeys, currentQuestionKey, userIsMarried)} />
         </Card>
      );
   } else {
      return null;
   }
}

Flow.propTypes = {
   flowData: PropTypes.object.isRequired,
   userHistory: PropTypes.array,
   resumeFlowQuestionKey: PropTypes.string,
   answers: PropTypes.object.isRequired,
   userIsMarried: PropTypes.bool,
   updateAnswersHandler: PropTypes.func.isRequired,
   updateUserData: PropTypes.func.isRequired,
}

export default Flow;
