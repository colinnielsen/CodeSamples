const AuthFlow = () => {
  const [error, setError] = React.useState(undefined);
  const [isLoading, setIsLoading] = React.useState(false);
  const [authStep, _setAuthStep] = React.useState({ history: ["unvalidated"], current: "unvalidated" });
  const setAuthStep = (newState) => _setAuthStep({ history: [...authStep.history, newState], current: newState });
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const componentMapping = {
    unvalidated: CheckEmail,
    isNewUser: SignUp,
    isExistingUser: Login,
    requestResetPassword: RequestResetPassword,
  };

  const setUI = (func) => {
    setError(undefined);
    setIsLoading(true);
    return func();
  };

  const goBack = () =>
    _setAuthStep({
      history: authStep.history.slice(0, -1),
      current: authStep.history[authStep.history.length - 2],
    });

  const fbCatch = (e) => {
    setIsLoading(false);
    setError(e.message);
    return Promise.reject();
  };

  const checkEmail = () =>
    firebase
      .auth()
      .fetchSignInMethodsForEmail(email)
      .then((signInMethods) => {
        setIsLoading(false);
        const isNewUser = signInMethods.length === 0;
        if (isNewUser) setAuthStep("isNewUser");
        else setAuthStep("isExistingUser");
      })
      .catch(fbCatch);

  const login = () =>
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => setIsLoading(false))
      .catch(fbCatch);

  const signUp = () =>
    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(() => setIsLoading(false))
      .catch(fbCatch);

  const requestResetPassword = () =>
    firebase
      .auth()
      .sendPasswordResetEmail(email)
      .then(() => {
        setIsLoading(false);
        setPassword(undefined);
        setTimeout(() => setAuthStep("unvalidated"), 5000);
        return Promise.resolve();
      })
      .catch(fbCatch);

  const showRequestResetPassword = () => {
    setError(undefined);
    setAuthStep("requestResetPassword");
  };

  const AuthStep = componentMapping[authStep.current];
  const props = {
    showRequestResetPassword,
    email,
    setEmail,
    password,
    setPassword,
    error,
    login: () => setUI(login),
    checkEmail: () => setUI(checkEmail),
    signUp: () => setUI(signUp),
    requestResetPassword: () => setUI(requestResetPassword),
    isLoading,
  };

  return (
    <Block width='400px'>
      <Card overrides={{ Action: { style: () => ({ paddingLeft: "16px", paddingRight: "16px" }) } }}>
        <AuthStep {...props}>
          <Button overrides={{ BaseButton: { style: { width: "25%" } } }} onClick={() => goBack()} kind='secondary'>
            Back
          </Button>
        </AuthStep>
        <Error errorMessage={error} />
      </Card>
    </Block>
  );
};

const Error = ({ errorMessage }) => (
  <>{errorMessage ? <Notification kind='negative'>{() => errorMessage}</Notification> : null}</>
);

const CheckEmail = ({ email, setEmail, checkEmail, isLoading }) => (
  <>
    <H3>Enter your email</H3>
    <StyledContents>
      <Input placeholder='Email' type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button
        overrides={{ BaseButton: { style: { width: "100%", marginTop: "10px" } } }}
        onClick={() => checkEmail()}
        disabled={!email}
        isLoading={isLoading}>
        Next
      </Button>
    </StyledContents>
  </>
);

const SignUp = ({ email, setEmail, password, setPassword, signUp, isLoading, children }) => (
  <>
    <H3>sign up with email</H3>
    <StyledContents>
      <Input placeholder='Email' type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input placeholder='Password' type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
      {children}
      <Button
        overrides={{ BaseButton: { style: { width: "75%", marginTop: "10px" } } }}
        onClick={() => signUp()}
        isLoading={isLoading}>
        Sign up
      </Button>
    </StyledContents>
  </>
);

const Login = ({ password, setPassword, login, showRequestResetPassword, isLoading, children }) => (
  <>
    <H3>Welcome Back</H3>
    <StyledContents>
      <Input placeholder='password' type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
      {children}
      <Button
        overrides={{ BaseButton: { style: { width: "75%", marginTop: "10px" } } }}
        onClick={() => login()}
        disabled={!password}
        isLoading={isLoading}>
        Login
      </Button>
    </StyledContents>
    <StyledAction>
      <Button onClick={() => showRequestResetPassword()} kind='minimal'>
        Trouble signing in?
      </Button>
    </StyledAction>
  </>
);

const RequestResetPassword = ({ email, setEmail, requestResetPassword, isLoading, children }) => {
  const [notification, setNotification] = React.useState(undefined);
  return (
    <>
      <H3>Recover Password</H3>
      <StyledContents>
        <Paragraph1>Get instructions sent to this email that will explain how to reset your password</Paragraph1>
        <Input placeholder='email' type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
        {children}
        <Button
          overrides={{ BaseButton: { style: { width: "75%", marginTop: "10px" } } }}
          onClick={() => requestResetPassword().then(() => setNotification("Email Sent"))}
          isLoading={isLoading}
          disabled={!!notification}>
          Send
        </Button>
      </StyledContents>
      {notification ? <Notification>{() => notification}</Notification> : null}
    </>
  );
};

export default AuthFlow;
