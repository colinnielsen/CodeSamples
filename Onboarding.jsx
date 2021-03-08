// Closure-based, linked-list style questionnaire flow. This specific example was meant to onboard multiple types of users to a purchase.
// The power of this pattern really lies in the 'next' function on line 15
// The next on each link can either be static or dynamic based on the answer the user selects.

export const OnboardingPage = () => {
  const stripe = useStripe();
  const [history, setHistory] = React.useState(['customerType']);
  const [answers, setAnswers] = React.useState({});
  const [currentQuestion, _setCurrentQuestion] = React.useState({ id: 'customerType', next: 'paymentModel' });
  const [loading, setLoading] = React.useState();
  const [error, setError] = React.useState();

  const setAnswer = (id, answer) => setAnswers(prevAnswers => ({ ...prevAnswers, [id]: answer }));

  const next = () => {
    const current = typeof (currentQuestion.next) === 'string'
      ? currentQuestion.next
      : currentQuestion.next[answers[currentQuestion.id]]
    _setCurrentQuestion(questions[current])
    setHistory(history => ([...history, current]));
  };

  const back = () => {
    setHistory(history.slice(0, -1));
    _setCurrentQuestion(questions[history[history.length - 2]]);
  }

  const StripeButton = () => <Button
    overrides={{ BaseButton: { style: { backgroundColor: '#2596DE', color: 'white', ':hover': { backgroundColor: '#4FB1F7' } } } }}
    onClick={() => {
      setLoading(true);
      BillingAPI.purchase(stripe, answers)
        .then(() => setLoading(false))
        .catch((error) => {
          setError(error);
          setLoading(false);
        });
    }} isLoading={loading}>Purchase</Button>;

  const RadioInput = ({ setAnswer, id, currentAnswer, options }) =>
    <RadioGroup
      overrides={{ Root: { style: { marginLeft: '10px' } } }}
      marginLeft={'20px'}
      value={currentAnswer || ''}
      onChange={e => setAnswer(e.target.name, e.target.value)}
      name={id}
      align='vertical'
    >
      {options.map(({ description, value, label }, index) =>
        <Radio key={index} value={value} description={description}>{label}</Radio>
      )}
    </RadioGroup>;

  const QuestionCard = ({ caption, Question, buttons }) =>
    <Card title='Onboard' overrides={{ Root: { style: { width: '500px', minHeight: '300px', position: 'relative' } } }}>
      <Caption1>{caption}</Caption1>
      <StyledBody >
        <Question />
      </StyledBody>
      <Block display='flex' justifyContent='flex-end' position='absolute' bottom='10px' right='10px'>
        {buttons.map(CustomButton =>
          <Block marginLeft='4px' marginRight='4px'>
            <CustomButton />
          </Block>)}
      </Block>
    </Card>;

  const OnboardingPage = ({ children }) => <Block
    display='flex'
    flexDirection='column'
    width='80vw'
    height='85vh'
    alignItems='center'
    justifyContent='center'
  >
    {children}
  </Block>;

  const questions = {
    'customerType': {
      id: 'customerType',
      next: 'paymentModel',
      caption: 'Welcome to DCalc',
      Question: () => <>
        <Label2>I am a...</Label2>
        <RadioInput
          setAnswer={setAnswer}
          id={'customerType'}
          currentAnswer={answers['customerType']}
          options={[{ label: 'Contractor', value: 'contractor' }, { label: 'Business', value: 'business' }]}
        />
      </>,
      buttons: [() => <Button onClick={next} disabled={!answers['customerType']}>Next</Button>]
    },
    'paymentModel': {
      id: 'paymentModel',
      next: { perpetual: answers['customerType'] === 'business' ? 'licenseAmount' : 'apiAccess', subscription: 'subscriptionModel' },
      caption: 'Choose a way to pay for DCalc',
      Question: () => <>
        <Label2>Payment Model</Label2>
        <RadioInput
          setAnswer={setAnswer}
          id={'paymentModel'}
          currentAnswer={answers['paymentModel']}
          options={[{ label: 'Subscription-based license', value: 'subscription' }, { label: 'Perpetual License', description: 'One time payment for lifetime access', value: 'perpetual' },]}
        />
      </>,
      buttons: [() => <Button onClick={back} kind='tertiary'>Back</Button>, () => <Button disabled={!answers['paymentModel']} onClick={next}>Next</Button>]
    },
    'subscriptionModel': {
      id: 'subscriptionModel',
      next: answers['customerType'] === 'business' ? 'licenseAmount' : 'apiAccess',
      caption: 'Great! Now how would you like to subscribe...',
      Question: () => <>
        <Label2>Subscription Model</Label2>
        <RadioInput
          setAnswer={setAnswer}
          id={'subscriptionModel'}
          currentAnswer={answers['subscriptionModel']}
          options={[{ label: 'Monthly - $50/mo per license', value: 'monthly' }, { label: 'Annually - $500/yr per license', value: 'annually' },]}
        />
      </>,
      buttons: [() => <Button onClick={back} kind='tertiary'>Back</Button>, () => <Button disabled={!answers['subscriptionModel']} onClick={next}>Next</Button>]
    },
    'licenseAmount': {
      id: 'licenseAmount',
      next: 'apiAccess',
      caption: 'How many licenses does your business need?',
      Question: () => {
        return <>
          <FormControl label="License Amount" error={Number(answers['licenseAmount']) > 50 ? 'Cannot buy more than 50 licenses at a time.' : undefined}>
            <Input
              type='number'
              value={answers['licenseAmount']}
              onChange={e => {
                setAnswer('licenseAmount', e.target.value)
              }}
              autoFocus={true}
            />
          </FormControl>

        </>
      },
      buttons: [() => <Button onClick={back} kind='tertiary'>Back</Button>, () => <Button disabled={answers['licenseAmount'] < 0 || !answers['licenseAmount'] || Number(answers['licenseAmount']) > 50} onClick={next}>Next</Button>]
    },
    'apiAccess': {
      id: 'apiAccess',
      next: 'summary',
      caption: 'One last thing...',
      Question: () => <>
        <Label2>Do you need API Access?</Label2>
        <Block marginTop={'8px'} marginLeft={'20px'}>
          <Checkbox
            onChange={e => setAnswer('apiAccess', e.target.checked)}
            checked={answers['apiAccess']}
            labelPlacement='right'
          >Include API Access</Checkbox>
          <Caption2>$5000/per 25,000 requests</Caption2>
        </Block>
      </>,
      buttons: [() => <Button onClick={back} kind='tertiary'>Back</Button>, () => <Button onClick={next}>Next</Button>]
    },
    'summary': {
      id: 'summary',
      next: null,
      caption: `Let's wrap up`,
      Question: () => {
        const { productInfo: { cost, billingFrequency }, total: { startingCost, recurring, } } = calcTotals(answers);
        return <>
          <Label2>Summary</Label2>
          <Block display='flex' flexDirection='row' height='40px' alignItems='center' justifyContent='space-between' paddingLeft='10px' marginTop='20px'>
            <Paragraph2>{answers.licenseAmount ? answers.licenseAmount : '1'}x DCalc license{answers.licenseAmount > 1 && 's'} for commercial use</Paragraph2>
            <b>${cost}{billingFrequency.short}</b>
          </Block>
          {answers.apiAccess && <Block height='40px' display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' paddingLeft='10px'>
            <Paragraph2>25,000 API calls</Paragraph2>
            <b>$5000</b>
          </Block>}
          <Block width='100%' display='flex' justifyContent='flex-end' marginRight='4px' height='100px'>
            <Paragraph1>Total: <b>${startingCost}</b>{billingFrequency.long !== 'lifetime' && ` + $${recurring} billed ${billingFrequency.long}`}</Paragraph1>
          </Block>
        </>
      },
      buttons: [() => <Button kind='tertiary' onClick={back}>Back</Button>, StripeButton]
    },
  }

  return <OnboardingPage>
    <Registration />
    <QuestionCard {...questions[currentQuestion.id]} />
  </OnboardingPage>;
}

export default withStripe(OnboardingPage);
