import "./formList.css";

import { Button, ButtonGroup, Card, Col, Row } from "react-bootstrap";
import React, { useContext, useEffect, useState } from "react";
import {
	SortableContainer,
	SortableElement,
	SortableHandle,
	arrayMove
} from "react-sortable-hoc";

import { AuthContext } from "context/authContext";
import { BBCodeFormType } from "types/formTypes";
import CopyToClipboard from "react-copy-to-clipboard";
import Firebase from "components/firebase/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FormCreator from "pages/form/creator/formCreator";
import { InfoToast } from "components/toast/toast";
import { LinkContainer } from "react-router-bootstrap";
import StandardModal from "components/modals/standardModal";
import { getFormUid } from "formatters";

const DragHandle = SortableHandle(() => (
	<div className="drag-handle">
		<FontAwesomeIcon icon="bars" />
	</div>
));

type SortableFormElementProps = {
	form: BBCodeFormType;
	showEditButtons: boolean;
	editForm: () => void;
	deleteForm: () => void;
};
type SortableFormsContainerProps = {
	forms: BBCodeFormType[];
	showEditButtons: boolean;
	editBBCodeForm: (form: BBCodeFormType) => void;
	deleteBBCodeForm: (form: BBCodeFormType) => void;
	setPageModal: (pageModal: {
		message: string;
		visible: boolean;
		continueAction: () => void;
	}) => void;
};
const SortableFormElement = SortableElement(
	({
		form,
		editForm,
		deleteForm,
		showEditButtons
	}: SortableFormElementProps) => {
		const { authUser } = useContext(AuthContext);
		return (
			<div className="form-element">
				{showEditButtons && <DragHandle />}
				<Card bg="light" color="white" style={{ borderRadius: 0 }}>
					<Card.Body>
						<Card.Title>
							{form.name}
							<CopyToClipboard
								text={
									process.env.NODE_ENV === "development"
										? `localhost:3000/form/shareable/${authUser?.uid}/${form.uid}`
										: `bbcode.rip/form/shareable/${authUser?.uid}/${form.uid}`
								}
								onCopy={() => InfoToast(`Shareable link copied to clipboard`)}>
								<Button variant="link" size="sm" onClick={() => null}>
									<FontAwesomeIcon icon="link"></FontAwesomeIcon>
								</Button>
							</CopyToClipboard>
						</Card.Title>
						{showEditButtons && (
							<ButtonGroup>
								<Button
									variant="warning"
									size="sm"
									onClick={() => editForm()}
									style={{ marginRight: "1rem" }}>
									Edit
								</Button>
								<Button variant="danger" size="sm" onClick={() => deleteForm()}>
									Delete
								</Button>
							</ButtonGroup>
						)}
					</Card.Body>
				</Card>
				<LinkContainer to={`/form/${form.uid}`} exact>
					<Button className="form-element-go-button" variant="info">
						<FontAwesomeIcon icon="arrow-right"></FontAwesomeIcon>
					</Button>
				</LinkContainer>
			</div>
		);
	}
);

const SortableFormContainer = SortableContainer(
	({
		forms,
		setPageModal,
		editBBCodeForm,
		deleteBBCodeForm,
		showEditButtons
	}: SortableFormsContainerProps) => {
		return (
			<ul style={{ padding: 0 }}>
				{forms &&
					forms.map((form, index) => (
						<SortableFormElement
							form={form}
							showEditButtons={showEditButtons}
							key={index}
							index={index}
							editForm={() => {
								setPageModal({
									visible: true,
									continueAction: () => editBBCodeForm(form),
									message: `Editing '${form.name}' will clear out any current values in the form fields. This cannot be undone.`
								});
							}}
							deleteForm={() => {
								setPageModal({
									visible: true,
									continueAction: () => deleteBBCodeForm(form),
									message: `Are you sure you want to permanently delete '${form.name}' from your forms?.`
								});
							}}
						/>
					))}
			</ul>
		);
	}
);

const FormList = () => {
	const [pageModal, setPageModal] = useState<{
		message: string;
		visible: boolean;
		continueAction: () => void;
	}>();
	const { authUser, stateForms } = useContext(AuthContext);

	const [editMode, setEditMode] = useState(false);
	const [showEditButtons, setShowEditButtons] = useState(false);
	const [forms, setForms] = useState<BBCodeFormType[]>(stateForms);

	const editBBCodeForm = (bbCodeForm: BBCodeFormType) => {
		const formProgressString = `formProgress_${bbCodeForm.uid}`;
		localStorage.removeItem(formProgressString);
		localStorage.setItem(
			"editBBCodeForm",
			JSON.stringify(stateForms.find((form) => form.uid === bbCodeForm.uid))
		);
		setEditMode(true);
	};
	const saveEdits = (bbCodeForm: BBCodeFormType) => {
		localStorage.removeItem("editBBCodeForm");
		if (
			JSON.stringify(bbCodeForm) !==
			JSON.stringify(stateForms.find((form) => form.uid === bbCodeForm.uid))
		) {
			Firebase()
				.saveForm(
					bbCodeForm.uid,
					{ ...bbCodeForm, uid: getFormUid(bbCodeForm.name) },
					authUser?.uid
				)
				.then(() => {
					setEditMode(false);
					setShowEditButtons(false);
				});
		} else {
			setEditMode(false);
			setShowEditButtons(false);
		}
	};

	const deleteBBCodeForm = (bbCodeForm: BBCodeFormType) => {
		const formProgressString = `formProgress_${bbCodeForm.uid}`;
		localStorage.removeItem(formProgressString);
		Firebase()
			.deleteUserForm(bbCodeForm.uid)
			.then(() => {
				setShowEditButtons(false);
				InfoToast(`'${bbCodeForm.name}' deleted.`);
			});
	};

	const onDragEnd = (sortObject: { oldIndex: number; newIndex: number }) => {
		var reorderedForms = arrayMove(
			forms,
			sortObject.oldIndex,
			sortObject.newIndex
		);
		reorderedForms = reorderedForms.map((form, i) => {
			return {
				...form,
				order: i + 1
			};
		});
		setForms(reorderedForms);
	};

	const toggleEditFormList = () => {
		if (!showEditButtons) {
			setShowEditButtons(true);
		} else {
			if (JSON.stringify(stateForms) !== JSON.stringify(forms)) {
				Firebase()
					.batchUpdateForms(forms, authUser?.uid)
					.then(() => {
						setShowEditButtons(false);
					});
			} else {
				setShowEditButtons(false);
			}
		}
	};
	useEffect(() => {
		setForms(stateForms);
	}, [stateForms]);

	return !editMode ? (
		<Row>
			<Col xs={12}>
				<div
					className="header"
					style={{ display: "flex", justifyContent: "space-between" }}>
					<div style={{ display: "flex" }}>
						<h3>My Forms</h3>
					</div>
					<LinkContainer to={"/forms/new"}>
						<Button variant="secondary">New Form</Button>
					</LinkContainer>
				</div>
			</Col>
			<Col xs={12} style={{ marginTop: "1rem" }}>
				{forms.length > 0 && (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							marginBottom: "1rem"
						}}>
						<Button
							variant="link"
							size="sm"
							onClick={() => toggleEditFormList()}
							style={{ marginRight: "1rem", padding: "0" }}>
							<FontAwesomeIcon
								color={!showEditButtons ? "grey" : "#46a989"}
								icon={!showEditButtons ? "lock" : "lock-open"}
							/>
						</Button>
						<div className="small text-muted">
							{!showEditButtons ? "Unlock to edit." : "Relock to save."}
						</div>
					</div>
				)}
				<SortableFormContainer
					useDragHandle
					onSortEnd={onDragEnd}
					forms={forms}
					showEditButtons={showEditButtons}
					editBBCodeForm={editBBCodeForm}
					deleteBBCodeForm={deleteBBCodeForm}
					setPageModal={setPageModal}
				/>
			</Col>
			<StandardModal
				visible={pageModal?.visible || false}
				handleClose={() =>
					setPageModal({
						visible: false,
						continueAction: () => null,
						message: ""
					})
				}
				handleContinue={pageModal?.continueAction}
				message={pageModal?.message}
				title="Warning"
				closeBtnText="Cancel"
				continueBtnText="Continue"
			/>
		</Row>
	) : (
		<FormCreator editMode={true} saveEdits={saveEdits} />
	);
};

export default FormList;
