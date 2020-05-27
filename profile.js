import React, { useState, useEffect } from 'react';
import { useStyletron } from 'styletron-react';
import { FirebaseUserContext } from '../data/FirebaseUserContext';
import { CardFadeAnimation } from '../utilities/animations';
import { numberToDisplayString, displayStringToNumber } from '../utilities/utilityFunctions';
import DOBInput from '../KnottyNodesReactFlow/components/Flow/Question/DOBInput';
import TrueFalseSelector from '../KnottyNodesReactFlow/components/Flow/Question/TrueFalseSelector';
import { ReactComponent as AvatarSVG } from './assets/profile-avatar.svg';
import {
   Display1,
   Display2,
   Display3,
   Display4,
   H5,
   Paragraph1,
   Paragraph2,
} from 'baseui/typography'
import {
   Card,
   StyledBody,
   StyledAction
} from 'baseui/card';
import {
   Checkbox,
   LABEL_PLACEMENT
} from 'baseui/checkbox';
import { FlexGrid, FlexGridItem } from 'baseui/flex-grid';
import { StatefulPopover } from 'baseui/popover';
import { Select } from 'baseui/select';
import { Block } from 'baseui/block';
import CheckIndeterminate from 'baseui/icon/check-indeterminate';
import { ListItem, ListItemLabel } from 'baseui/list';
import { Button, SHAPE, SIZE } from 'baseui/button';
import { Spinner } from 'baseui/spinner';
import { Input } from 'baseui/input';
import Check from 'baseui/icon/check'
import Plus from 'baseui/icon/plus'
import Delete from 'baseui/icon/delete'

const UserCard = ({
   editProfile,
   updateAnswers,
   updatedAnswers,
   userData,
   isUser,
   children
}) => {
   const currentUser = isUser ? 'user' : 'spouse';
   const renderEditorView = editProfile[currentUser];
   userData = userData[currentUser];
   const widthOverride = {
      overrides: {
         Block: {
            style: () => ({ minWidth: '150px' })
         }
      }
   }
   if (renderEditorView) {
      return (
         <Card
            overrides={{
               Root: {
                  style: () => ({
                     marginBottom: '25px',
                     boxShadow: '0 2px 2px rgba(0,0,0,0.10)'
                  })
               }
            }}
         >
            <StyledBody>
               {children}
               <ListItem>
                  <Paragraph2 {...widthOverride}>Full Name: </Paragraph2>
                  <Input
                     value={updatedAnswers.name || ''}
                     name='name'
                     type='text'
                     onChange={({ target }) => updateAnswers(target, currentUser, 'user')}
                  />
               </ListItem>
               <ListItem>
                  <Paragraph2 {...widthOverride}>Date of Birth: </Paragraph2>
                  <DOBInput
                     value={updatedAnswers.dob}
                     id='dob'
                     type='user'
                     user={currentUser}
                     handleInputChange={updateAnswers}
                  />
               </ListItem>
               <ListItem>
                  <Paragraph2 {...widthOverride}>Veteran: </Paragraph2>
                  <TrueFalseSelector
                     value={updatedAnswers.veteran}
                     id='veteran'
                     type='user'
                     user={currentUser}
                     handleInputChange={updateAnswers}
                  />
               </ListItem>
               <ListItem>
                  <Paragraph2 {...widthOverride}>Years worked for Government: </Paragraph2>
                  <Input
                     value={updatedAnswers.governmentYears || ''}
                     name='governmentYears'
                     type='number'
                     onChange={({ target }) => updateAnswers(target, currentUser, 'user')}
                  />
               </ListItem>
               <ListItem>
                  <Paragraph2 {...widthOverride}>Planned Retire Date: </Paragraph2>
                  <DOBInput
                     value={updatedAnswers.retireDate}
                     id='retireDate'
                     type='user'
                     user={currentUser}
                     handleInputChange={updateAnswers}
                  />
               </ListItem>
            </StyledBody>
         </Card>
      );
   } else {
      return (
         <Card
            overrides={{
               Root: {
                  style: () => ({
                     marginBottom: '25px',
                     boxShadow: '0 1px 1px rgba(0,0,0,0.08)'
                  })
               }
            }}
         >
            <StyledBody>
               {children}
               <H5>Full Name: {userData.name}</H5>
               <Paragraph1>Date Of Birth: {userData.dob}</Paragraph1>
               <Paragraph1>Veteran: {userData.veteran === false ? 'No' : 'Yes'}</Paragraph1>
               <Paragraph1>Years worked for Government: {userData.governmentYears}</Paragraph1>
               <Paragraph1>Planned Retire Date: {userData.retireDate}</Paragraph1>
            </StyledBody>
         </Card>
      );
   }
}

const DependantCard = ({ editProfile, userData, userAPI }) => {
   return (
      <Card
         overrides={{
            Root: {
               style: () => ({
                  marginBottom: '25px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.10)'
               })
            }
         }}
      >
         <Display4>Dependents</Display4>
         <ListItem>
            <StyledBody> Dependents: {userData.dependents.number} </StyledBody>
         </ListItem>
         {editProfile.user &&
            <StyledAction>
               <Button onClick={() => userAPI.setDependents(userData.dependents.number - 1)}
                  overrides={{
                     BaseButton: { style: { width: '50%' } }
                  }}
               >
                  Remove Dependent
                        <CheckIndeterminate size={20} />
               </Button>
               <Button onClick={() => userAPI.setDependents(userData.dependents.number + 1)}
                  overrides={{
                     BaseButton: { style: { width: '50%' } }
                  }}
               >
                  Add Dependent
                        <Plus size={20} />
               </Button>
            </StyledAction>
         }
      </Card>
   )
}

const ProfileCard = ({
   isUser,
   type,
   editProfile,
   updatedAnswers,
   updateAnswers,
   deleteItem,
   addNewItem
}) => {
   const singularType = type.slice(-1) === 's' ? type.slice(0, -1) : type;
   const currentUser = isUser ? 'user' : 'spouse';
   const renderEditorView = editProfile[currentUser];
   const itemList = updatedAnswers.hasOwnProperty(type) ? updatedAnswers[type].filter(item => item.display !== false) : [];
   const [displayBlankItem, setDisplayBlankItem] = useState(false);
   let list = [];

   if (renderEditorView) {
      list = itemList.map((item, index) => {
         const displayName = item.name.split(' ').map(word => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`).join(' '); //capitalize the first letter of each word
         const amount = updatedAnswers[type].find(el => el.name === item.name).amount;
         const isTaxed = item.hasOwnProperty('taxed');
         const isTaxDeferred = item.hasOwnProperty('tax-deferred');
         const checkLabel = isTaxed ? 'Taxed' : (isTaxDeferred && 'Tax Deferred');
         const key = type === 'expenses' ? 'taxed' : (type === 'assets' && 'tax-deferred');
         return (
            <ListItem key={index}>
               <Paragraph2
                  overrides={{
                     Block: {
                        style: () => ({ minWidth: '70px' })
                     }
                  }}
               >
                  {displayName}
               </Paragraph2>
               <Input
                  value={numberToDisplayString(amount)}
                  key={index}
                  name={item.name}
                  onChange={({ target }) => {
                     let convertedVal = displayStringToNumber(target.value);
                     updateAnswers({ value: convertedVal, name: item.name }, currentUser, type, 'amount');
                  }}
                  startEnhancer={() => '$'}
                  overrides={{
                     Root: {
                        style: () => ({ marginLeft: '10px' })
                     }
                  }}
               />
               {(type === 'assets' || type === 'expenses') &&
                  <Checkbox
                     checked={updatedAnswers[type].find(el => el.name === item.name)[key]}
                     labelPlacement={LABEL_PLACEMENT.left}
                     onChange={({ target }) => updateAnswers({ value: target.checked, name: item.name }, currentUser, type, key)}
                     overrides={{
                        Root: {
                           style: () => ({ marginLeft: '10px', alignItems: 'center' })
                        }
                     }}
                  >
                     {checkLabel}
                  </Checkbox>
               }
               <DeleteButton
                  type={type}
                  index={index}
                  deleteItem={deleteItem}
                  typeMessage={singularType}
                  user={currentUser}
                  itemList={itemList}
               />
            </ListItem>
         );
      })
   } else {
      list = itemList.map((item, index) => {
         let isTaxed = item.hasOwnProperty('taxed');
         let isTaxDeferred = item.hasOwnProperty('tax-deferred');
         return (
            <ListItem key={index}>
               <ListItemLabel>
                  {item.name.slice(0, 1).toUpperCase() + item.name.slice(1)} - {' '}
                        ${numberToDisplayString(item.amount)}
                  {isTaxDeferred ?
                     ' - Tax Deferred: ' :
                     isTaxed &&
                     ' - Taxed: '
                  }
                  {isTaxDeferred ?
                     (item['tax-deferred'] ? 'Yes' : 'No') :
                     (isTaxed &&
                        (item.taxed ? 'Yes' : 'No'))
                  }
               </ListItemLabel>
            </ListItem>
         )
      });
   }

   return (
      <Card
         overrides={{
            Root: {
               style: () => ({
                  marginBottom: '25px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.10)'
               })
            }
         }}
      >
         <Display4>{`${type.slice(0, 1).toUpperCase()}${type.slice(1)}`}</Display4>
         {list}
         {displayBlankItem && renderEditorView &&
            <BlankItem
               type={type}
               singularType={singularType}
               itemList={itemList}
               currentUser={currentUser}
               addNewItem={addNewItem}
               setDisplayBlankItem={setDisplayBlankItem}
            />
         }
         {(renderEditorView && !displayBlankItem) &&
            <StyledAction>
               <Button
                  onClick={() => setDisplayBlankItem(true)}
                  overrides={{ BaseButton: { style: () => ({ marginTop: '20px', marginBottom: '10px' }) } }}
               >
                  Add {singularType} {' '}
                  <Plus size={35} />
               </Button>
            </StyledAction>
         }
      </Card>
   )
}

const DeleteButton = ({ type, index, typeMessage, deleteItem, user, itemList }) => {
   const handleDelete = (close) => {
      const updatedList = itemList.filter((_, itemIndex) => itemIndex !== +index)
      deleteItem(updatedList, user, type);
      close();
   }

   return (
      <StatefulPopover
         content={({ close }) => (
            <Block style={{ display: 'flex', alignItems: 'center' }} padding={'20px'}>
               Are you sure you want to<br />delete this {typeMessage}?
               <Button
                  style={{ marginLeft: '20px' }}
                  onClick={() => handleDelete(close)}
               >
                  Yes
                    </Button>
            </Block>
         )}
         returnFocus
         autoFocus
      >
         <Button
            shape='square'
            size='compact'
            kind='secondary'
            overrides={{
               BaseButton: {
                  style: () => ({
                     backgroundColor: 'red',
                     marginLeft: '10px',
                  })
               }
            }}>
            <Delete />
         </Button>
      </StatefulPopover>
   )
}

const BlankItem = ({
   type,
   singularType,
   itemList,
   currentUser,
   addNewItem,
   setDisplayBlankItem
}) => {
   const [newItemId, setNewItemId] = useState([]);
   const [inputValue, setInputValue] = useState('0');
   const [isChecked, setIsChecked] = useState(false);
   const isTaxed = type === 'expenses';
   const isTaxDeferred = type === 'assets';
   const checkLabel = isTaxed ? 'Taxed' : (isTaxDeferred && 'Tax Deferred');
   const taxKey = checkLabel && checkLabel.toLowerCase().replace(/\s/g, '-');

   const itemOptions = {
      assets: [{ label: 'Roth', id: 'roth' }, { label: '401k', id: '401k' }, { label: '403b', id: '403b' }, { label: 'Stocks', id: 'stocks' }],
      expenses: [{ label: 'Living Expenses', id: 'living-expenses' }, { label: 'Payroll Deductions', id: 'payroll-deductions' }, { label: 'Retirement Plan', id: 'retirement-plan' }, { label: 'Roth Contributions', id: 'roth-contributions' }, { label: 'Personal Deductions', id: 'personal-deductions' }, { label: 'Loan Repayments', id: 'loan-repayments' }, { label: 'Charitable Contributions', id: 'charitable-contributions' }],
      income: [{ label: 'Monthly Income', id: 'monthly-income' }],
   }

   return (
      <Card
         overrides={{
            Root: {
               style: () => ({
                  marginTop: '32px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.10)'
               })
            }
         }}>
         <FlexGrid
            flexGridColumnCount={1}
            flexGridColumnGap="scale800"
            flexGridRowGap="scale800"
         >
            <FlexGridItem>
               <Select
                  options={itemOptions[type].filter(({ id }) => !itemList.map(item => item.type).includes(id))} //filters out assets that are already added
                  searchable={false}
                  value={newItemId}
                  noResultsMsg={`No more ${type} to add`}
                  placeholder={`Select ${singularType} type`}
                  onChange={({ value }) => setNewItemId(value)}
               />
            </FlexGridItem>
            <FlexGridItem>
               <Input
                  startEnhancer={() => '$'}
                  placeholder='Enter amount'
                  disabled={!newItemId[0] ? true : false}
                  value={numberToDisplayString(inputValue)}
                  onChange={({ target }) => setInputValue(displayStringToNumber(target.value))}
                  overrides={{
                     Root: {
                        style: () => ({ marginRight: '20px' })
                     }
                  }}
               />
            </FlexGridItem>
            <FlexGridItem>
               {(isTaxDeferred || isTaxed) &&
                  <Checkbox
                     size='large'
                     checked={isChecked}
                     labelPlacement={LABEL_PLACEMENT.right}
                     onChange={({ target }) => setIsChecked(target.checked)}
                     overrides={{
                        Root: {
                           style: () => ({ marginLeft: '20px', marginRight: '20px', alignItems: 'center' })
                        }
                     }}
                  >
                     <Paragraph2>{checkLabel}</Paragraph2>
                  </Checkbox>
               }
            </FlexGridItem>
            <FlexGridItem>
               <Button
                  disabled={!newItemId[0] || !inputValue ? true : false}
                  size={SIZE.large}
                  onClick={() => {
                     addNewItem(newItemId[0], inputValue, currentUser, type, { [taxKey]: isChecked });
                     setDisplayBlankItem(false);
                  }}
                  overrides={{
                     BaseButton: {
                        style: () => ({ float: 'right', marginRight: '20px' })
                     }
                  }}
               >
                  Add To Profile
                        <Check size={30} />
               </Button>
            </FlexGridItem>
         </FlexGrid>
      </Card>
   );
}

const Profile = () => {
   const { userData, userAPI, loading } = React.useContext(FirebaseUserContext);
   const [editProfile, setEditProfile] = useState({ user: false, spouse: false });
   const [updatedUserAnswers, setUpdatedUserAnswers] = useState();
   const [updatedSpouseAnswers, setUpdatedSpouseAnswers] = useState();
   const [css] = useStyletron();

   const addNewItem = (newItem, value, currentUser, type, taxation) => {
      !isNaN(+value) && typeof value !== 'boolean' && (value = +value);
      if (currentUser === 'user') {
         setUpdatedUserAnswers(prevState => (
            {
               ...prevState,
               [type]: [
                  ...prevState[type],
                  {
                     name: newItem.label,
                     type: newItem.id,
                     amount: value,
                     display: true,
                     ...taxation
                  }
               ]
            }
         ));
      } else {
         setUpdatedSpouseAnswers(prevState => (
            {
               ...prevState,
               [type]: [
                  ...prevState[type],
                  {
                     name: newItem.label,
                     type: newItem.id,
                     amount: value,
                     display: true
                  }
               ]
            }
         ));
      }
   }

   const deleteItem = (list, user, type) => {
      if (user === 'user') {
         setUpdatedUserAnswers(prevState => (
            {
               ...prevState,
               [type]: list
            }
         ));
      } else {
         setUpdatedSpouseAnswers(prevState => (
            {
               ...prevState,
               [type]: list
            }
         ));
      }
   }

   const updateAnswers = (target, user, type, key) => {
      let { name, value } = target;
      value === 'true' && (value = true);
      value === 'false' && (value = false);
      if (user === 'user') {
         if (type === 'user') { //if it is meant to go on the base level of the user object
            setUpdatedUserAnswers(prevState => (
               {
                  ...prevState,
                  [name]: value,
               }
            ));
         } else {
            setUpdatedUserAnswers(prevState => (
               {
                  ...prevState,
                  [type]: prevState[type].map(item => {
                     if (item.name !== name) {
                        return item;
                     }
                     return {
                        ...item,
                        [key]: value,
                     }
                  })
               }
            ));
         }
      } else {
         if (type === 'user') { //if it is meant to go on the base level of the user object
            setUpdatedSpouseAnswers(prevState => (
               {
                  ...prevState,
                  [name]: value,
               }
            ));
         } else {
            setUpdatedSpouseAnswers(prevState => (
               {
                  ...prevState,
                  [type]: prevState[type].map(item => {
                     if (item.name !== name) {
                        return item;
                     }
                     return {
                        ...item,
                        [key]: value,
                     }
                  })
               }
            ));
         }
      }
   }

   const SaveEditButtonGroup = ({ editProfile, user, updatedAnswers }) => {
      return (
         <>
            {editProfile[user] && <Button
               className={css({ float: 'right' })}
               size={SIZE.default}
               shape={SHAPE.pill}
               onClick={() => {
                  setEditProfile(prevState => {
                     return { ...prevState, [user]: !prevState[user] }
                  });
               }}
            >
               cancel
                    </Button>
            }
            <Button
               className={css({ float: 'right' })}
               size={SIZE.default}
               shape={SHAPE.pill}
               onClick={() => {
                  setEditProfile(prevState => {
                     prevState[user] &&
                        (user === 'user' ?
                           userAPI.mainUser.updateProfile(updatedAnswers) :
                           userAPI.spouse.updateProfile(updatedAnswers))
                     return {
                        ...prevState,
                        [user]: !prevState[user]
                     }
                  });
               }}
               overrides={{
                  BaseButton: {
                     style: () => ({
                        backgroundColor: editProfile[user] ? 'blue' : 'black'
                     })
                  }
               }}>
               {editProfile[user] ? 'save' : 'edit'}
            </Button>
         </>
      )
   }

   const RowHeader = ({ children }) => (
      <div className={css({
         height: '100px',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'space-between'
      })}>
         {children}
      </div>
   );

   useEffect(() => {
      if (!loading) {
         setUpdatedUserAnswers(userData.user);
         setUpdatedSpouseAnswers(userData.spouse);
      }
   }, [userData, loading, editProfile]);

   const cardOverrides = {
      overrides: {
         Root: {
            style: () => ({
               width: '27vw',
               margin: '10px',
               paddingBottom: '25px',
               background: 'linear-gradient(90deg, #FBFBFB, #FEFEFE)',
               height: 'max-content'
            })
         },
      },
   };

   const getPropsBundle = user => ({
      editProfile,
      userData,
      updatedAnswers: user === 'user' ? updatedUserAnswers : updatedSpouseAnswers,
      updateAnswers,
      deleteItem,
      addNewItem
   })

   if (loading || !updatedUserAnswers) {
      return (
         <div className={css({ height: '85%', display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
            <Spinner size={60} />
         </div>
      );
   } else {
      return (
         <div className={css({ display: 'flex', flexDirection: 'column', width: '100%' })}>
            <Display1 className={css({ float: 'left', marginLeft: '5px', marginTop: '5px' })}>Hello, {userData.user.name.split(' ')[0]}</Display1>
            <Display3 className={css({ paddingLeft: '30px', paddingTop: '20px', background: 'linear-gradient(90deg, #f3f4f9, #f6f7fb)' })} color='mono800'>
               Let's make sure your details are correct...
                </Display3>
            <div className={css({ display: 'flex', flexDirection: 'row', justifyContent: 'center', background: 'linear-gradient(90deg, #f3f4f9, #f6f7fb)', paddingTop: '80px', paddingBottom: '150px' })}>
               <CardFadeAnimation>
                  <Card {...cardOverrides}>
                     <RowHeader>
                        <Display2 className={css({ float: 'left', margin: '7px' })}>Your Profile</Display2>
                     </RowHeader>
                     <UserCard {...getPropsBundle('user')} isUser>
                        <SaveEditButtonGroup
                           editProfile={editProfile}
                           user='user'
                           updatedAnswers={updatedUserAnswers}
                        />
                     </UserCard>
                     <ProfileCard {...getPropsBundle('user')} type='assets' isUser />
                     <DependantCard {...getPropsBundle('user')} userAPI={userAPI} isUser></DependantCard>
                     <ProfileCard {...getPropsBundle('user')} type='income' isUser />
                     <ProfileCard {...getPropsBundle('user')} type='expenses' isUser />
                  </Card>
               </CardFadeAnimation>
               {updatedUserAnswers.married &&
                  <CardFadeAnimation delay={500}>
                     <Card {...cardOverrides}>
                        <div className={css({ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' })}>
                           <Display2 className={css({ float: 'left' })}>{updatedSpouseAnswers.name.split(' ')[0]}'s Profile</Display2>
                        </div>
                        <UserCard {...getPropsBundle('spouse')} isSpouse>
                           <SaveEditButtonGroup
                              editProfile={editProfile}
                              user='spouse'
                              updatedAnswers={updatedSpouseAnswers}
                           />
                        </UserCard>
                        <ProfileCard {...getPropsBundle('spouse')} type='assets' isSpouse />
                        <ProfileCard {...getPropsBundle('spouse')} type='income' isSpouse />
                        <ProfileCard {...getPropsBundle('spouse')} type='expenses' isSpouse />
                     </Card>
                  </CardFadeAnimation>
               }
               <AvatarSVG />
            </div>
         </div>
      );
   }
}

export default Profile; 