import { Bell } from "phosphor-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
	Button,
	Card,
	FileProcessing,
	SectionTitle,
	Stack,
	Subtitle,
	Text,
	Toast,
} from "components";
import { useFileDispatch, useFiles, useUser } from "hooks";
import type { PredictStatus } from "hooks/usePredict";
import { Footer, Section } from "layout/main";
import { filterUnprocessed, removeAllPredictions } from "reducers/file/actions";
import useNotify from "./useNotify";
import { canContinue, initProcessState, replace } from "./utils";

import { FunctionType } from "types/user";

export default function Process() {
	const user = useUser();
	const navigate = useNavigate();
	const dispatch = useFileDispatch();
	const files = useFiles();
	const [process, setProcess] = useState(initProcessState(files));
	const { isToastVisible, hideToast } = useNotify(process);

	const handleStatusChange = (name: string) => (newValue: PredictStatus) => {
		// Replace the newValue
		setProcess((cur) => replace(name, { status: newValue }, cur));
	};
	const handleReplaceFile = (name: string) => (newName: string) => {
		setProcess((cur) =>
			replace(name, { name: newName, status: "processing" }, cur),
		);
	};

	const handlePrevious = () => {
		navigate("/preview");
		dispatch(removeAllPredictions());
	};

	const handleNext = () => {
		dispatch(filterUnprocessed());

		if (user?.function === FunctionType.DATASET) {
			navigate("/validation/dataset");
		} else {
			navigate("/validation/anonymizer");
		}
	};

	return (
		<>
			<Section>
				<Toast isVisible={isToastVisible} onClose={hideToast} icon={<Bell />}>
					{user?.function === FunctionType.DATASET
						? "Se finalizó el análisis de tus documentos."
						: "Se finalizó el análisis del documento."}
				</Toast>
				<SectionTitle onClick={handlePrevious}>
					{user?.function === FunctionType.DATASET
						? "2. Procesamiento de los archivos"
						: "2. Procesamiento del documento"}
				</SectionTitle>
				<Card css={{ alignItems: "stretch" }}>
					<Stack spacing="l" direction="column">
						<Stack direction="column" spacing="xs">
							{user?.function === FunctionType.DATASET ? (
								<Text>AymurAI está extrayendo los datos de los archivos</Text>
							) : (
								<Text>AymurAI está extrayendo los datos del archivo</Text>
							)}
							<Subtitle size="s">
								Este proceso puede tardar algunos minutos.
							</Subtitle>
						</Stack>
						{files.map((f) => (
							<FileProcessing
								key={f.data.name}
								file={f}
								onStatusChange={handleStatusChange(f.data.name)}
								onFileReplace={handleReplaceFile(f.data.name)}
							/>
						))}
					</Stack>
				</Card>
			</Section>
			<Footer>
				<Button size="l" disabled={!canContinue(process)} onClick={handleNext}>
					Siguiente
				</Button>
			</Footer>
		</>
	);
}
