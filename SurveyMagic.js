import React, { useEffect, useRef, useState } from 'react';
import { FirebaseUserContext } from '../../../data/FirebaseUserContext';
import { useStyletron } from 'styletron-react';
import PropTypes from 'prop-types';
import Flow from '../Flow/Flow';
import { Spinner } from 'baseui/spinner';
import { Redirect } from 'react-router-dom';

const SurveyMagic = ({ url }) => {
   const { userAPI, userData, loading } = React.useContext(FirebaseUserContext);
   const flows = ['user', 'socialSecurity', 'assets', 'expenses'];
   const [currentFlow, setCurrentFlow] = useState();
   const [userAnswers, setUserAnswers] = useState({});
   const [userHistory, setUserHistory] = useState(['questions.0']);
   const [resumeFlowQuestionKey, setResumeFlowQuestionKey] = useState('questions.0');

   const [flowLoading, setFlowLoading] = useState(true);
   const [formData, setFormData] = useState();
   const [userIsMarried, setUserIsMarried] = useState();

   const [flowText, setFlowText] = useState();
   const [errorState, setErrorState] = useState();
   const [flowUrl, setFlowUrl] = useState();
   const [answers, setAnswers] = useState(userAnswers);
   const runOnce = useRef(false);
   const [css] = useStyletron();

   const testResetUserFlowData = () => {
      updateUserData({ surveyComplete: false, currentFlow: 'assets' });
   }

   const testFlowTransition = () => {
      updateUserData({
         surveyComplete: false,
         currentQuestionKey: 'questions.5',
         history: [
            'questions.0',
            'questions.1',
            'questions.2',
            'questions.3',
            'questions.4',
         ],
         currentFlow: 'expenses',
      })
   }

   const updateAnswersHandler = (user, name, value) => {
      if (name === 'married' && value === true) {
         setUserIsMarried(true);
      } else if (name === 'married' && value === false) {
         setUserIsMarried(false);
      }
      if (user === 'user') {
         return setAnswers({ ...answers, [name]: value });
      } else {
         return setAnswers({ ...answers, spouse: { ...answers.spouse, [name]: value } });
      }
   }

   const updateUserData = ({
      surveyComplete = false,
      currentQuestion = formData.questions[0],
      currentQuestionKey = 'questions.0', //bunch of defaults to reset flowProgressionData
      answers = { name: '' },
      history = ['questions.0'],
      currentFlow = formData.id
   }) => {
      const acceptableUserAnswers = ['name', 'dob', 'veteran', 'governmentYears', 'retireDate', 'married'];
      const answer = currentQuestion.user === 'spouse' ?
         answers.spouse[currentQuestion.id] :
         answers[currentQuestion.id];
      const existingUserData = currentQuestion.user === 'spouse' ?
         userData.spouse :
         userData.user;
      if (currentFlow === 'user') {
         if (acceptableUserAnswers.indexOf(currentQuestion.id) !== -1) {
            userAPI.mainUser.updateAnswers(
               existingUserData,
               currentQuestion,
               answer,
               currentFlow
            );   
         }
      } else {
         userAPI.mainUser.updateAnswers(
            existingUserData,
            currentQuestion,
            answer,
            currentFlow
         );
      }
      userAPI.mainUser.updateQuestionKeyAndHistory({
         surveyComplete,
         currentFlow,
         resumeFlowQuestionKey: currentQuestionKey,
         userHistory: history,
         userAnswers: answers,
      });
   }

   const clearResumeData = () => {
      setUserHistory(undefined);
      setUserAnswers(undefined);
      setResumeFlowQuestionKey(undefined);
   }

   useEffect(() => {
      if (!runOnce.current) {
         if (userAPI.mainUser) {
            testResetUserFlowData(); //two helper methods here to either reset the user data or bring the ssurvey to a certain point to test ( you must comment them in and refresh browser)
            // testFlowTransition();
         }
         let flow;
         if (userData.user.flowProgressionData) {
            const { resumeFlowQuestionKey, userAnswers, userHistory, currentFlow } = userData.user.flowProgressionData;
            if (resumeFlowQuestionKey && userAnswers && userHistory && currentFlow) { //resuming at a specific q
               setResumeFlowQuestionKey(resumeFlowQuestionKey);
               setUserHistory(userHistory);
               setUserAnswers(userAnswers);
               setAnswers(userAnswers);
               flow = currentFlow;
               runOnce.current = true;
            } else if (currentFlow) {
               setResumeFlowQuestionKey('questions.0')
               flow = currentFlow;
               runOnce.current = true;
            }
            userData.user.married === true && setUserIsMarried(true);
            runOnce.current = true;
         } else {
            flow = flows[0];
         }
         setCurrentFlow(flow);
         setFlowUrl(`/${flow}.json`);
      }
   }, [userData]);

   useEffect(() => {
      try {
         if (flowUrl) {
            fetch(flowUrl)
               .then(res => res.json())
               .then(formData => {
                  setFormData(formData);
                  setFlowText(formData.name);
                  setFlowLoading(false);
               });
         }
      } catch (e) {
         console.error(e);
         setErrorState(e);
      }
   }, [flowUrl]);

   const propsBundle = {
      userHistory,
      userAnswers,
      resumeFlowQuestionKey,
      formData,
      flows,
      setFlowUrl,
      currentFlow,
      setCurrentFlow,
      answers,
      userIsMarried,
      updateAnswersHandler,
      clearResumeData,
      updateUserData,
   }

   if (
      !flowLoading &&
      !loading &&
      userData.user.flowProgressionData &&
      userData.user.flowProgressionData.surveyComplete
   ) {
      return <Redirect exact to='/app/results/profile/' />
   } else if (loading && flowLoading) {
      return (
         <div className={css({ height: '85%', display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
            <Spinner size={60} />
         </div>
      )
   } else { //everything is finished.
      return (
         <div className={css({ padding: '18%' })}>
            <h1 data-testid='flowTitle'>{flowText}</h1>
            <Flow
               {...propsBundle}
            />
         </div>
      );
   }
}

SurveyMagic.propTypes = {
   url: PropTypes.string,
}

export default SurveyMagic;