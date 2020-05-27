describe('survey 🐒 🎩', () => {
   beforeAll(() => {
      global.fetch = fetch;
      fetchMock.mock('/userData.json', getTestUserData());
      fetchMock.mock('/person.json', getPersonFlowTestData());
   })
   afterEach(cleanup);
   afterAll(() => {
      fetchMock.restore();
   });

   it('initializes', async () => {
      const { getByTestId } = render(<SurveyMagic />);
      const flowTitle = await waitForElement(() => getByTestId("flowTitle"));

      expect(flowTitle.textContent).not.toBeNull;
   });

   it('initializes with resume data', async () => {
      fetchMock.config.overwriteRoutes = true;
      fetchMock.mock('/resumeUserData.json', getResumeUserData());
      const { getByText } = render(<SurveyMagic url='resumeUserData' />);
      const flowTitle = await waitForElement(() => getByText(/How many years did you work for the government?/i));

      expect(flowTitle.textContent).toMatch('How many years did you work for the government?');
   });

   it('transitions to next flow', async () => {
      fetchMock.mock('/socialSecurity.json', getSocialSecurityData());
      let endOfFlowData = getResumeUserData();
      endOfFlowData.resumeFlowQuestionKey = "4";
      endOfFlowData.userAnswers.government = "false";
      endOfFlowData.userAnswers.married = "false";
      fetchMock.mock('/resumeUserData.json', endOfFlowData);
      const { getByText, getByTestId } = render(<SurveyMagic url='resumeUserData' />);
      const nextArrow = await waitForElement(() => getByText(/Finish/i));
      fireEvent.click(nextArrow);
      const question = await waitForElement(() => getByTestId(/questionTitle/i));
      expect(question.textContent).toMatch('Do you plan on taking social security?');
   });

   it('receives user input', async () => {
      const { container } = render(<SurveyMagic />);
      const textInput = await waitForElement(() => container.querySelector('input'));
      let value = 'test';
      textInput.focus();
      Simulate.change(textInput, { keyCode: 65, key: 'a' }); //calling simulate to trigger onChange
      fireEvent.change(textInput, { target: { value } });
      expect(textInput.value).toMatch('test');
   })

