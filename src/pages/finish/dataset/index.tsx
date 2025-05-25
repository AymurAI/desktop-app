import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
	Button,
	Card,
	FileCheck,
	Grid,
	SectionTitle,
	Subtitle,
	Text,
} from "components";
import { useFileDispatch, useFiles, useUser } from "hooks";
import { Footer, Section } from "layout/main";
import { removeAllFiles } from "reducers/file/actions";
import filesystem from "services/filesystem";
import type { DocFile } from "types/file";
import { DATASET_URL } from "utils/config";
import { submitValidations } from "utils/file";
import Anchor from "../Anchor";

export default function Finish() {
	const files = useFiles();
	const dispatch = useFileDispatch();
	const navigate = useNavigate();
	const user = useUser();
	const [errorNames, setErrorNames] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const handleRestart = () => {
		dispatch(removeAllFiles());
		navigate("/onboarding");
	};

	const checkForErrors = (fileName: string) =>
		!!errorNames.find((name) => name === fileName);

	const submit = async (file: DocFile) => {
		try {
			// POST the validated data to the dataset
			await submitValidations({
				isOnline: user!.online,
				validations: file.validationObject,
			});
		} catch {
			setErrorNames((names) => [...names, file.data.name]);
		}

		// Export the feedback JSON
		await filesystem.feedback.export(files);
	};

	// At first render, submit all the data
	useEffect(() => {
		const submitAll = async () => {
			if (!user) return;

			for (const file of files) {
				await submit(file);
			}
		};

		submitAll().then(() => setIsLoading(false));

		// We strictly need to run this effect once
	}, []);

	return (
		<>
			<Section>
				<SectionTitle>4. Finalización</SectionTitle>
				<Text css={{ maxWidth: "60%" }}>
					Los datos encontrados por AymurAI y posteriormente validados ya son
					parte del set de datos abiertos con perspectiva de género.
				</Text>

				<Card>
					<Subtitle>Archivos procesados</Subtitle>
					<Grid
						columns={4}
						spacing="xl"
						justify="center"
						css={{ width: "100%" }}
					>
						{files.map(({ data }) => (
							<FileCheck
								key={data.name}
								fileName={data.name}
								hasError={checkForErrors(data.name)}
								{...{ isLoading }}
							/>
						))}
					</Grid>
				</Card>
			</Section>
			<Footer>
				<Anchor
					href="https://www.datagenero.org/"
					target="_blank"
					rel="noreferrer"
				>
					<img src="brand/data-genero.png" alt="DataGenero" width={150} />
				</Anchor>

				<Button variant="secondary" onClick={handleRestart} size="l">
					Cargar más documentos
				</Button>
				{user?.online ? (
					<Button
						css={{ textDecoration: "none" }}
						as="a"
						href={DATASET_URL}
						target="_blank"
						rel="noreferrer"
						size="l"
					>
						Ver set de datos
					</Button>
				) : (
					<Button size="l" onClick={filesystem.excel.open}>
						Ver set de datos
					</Button>
				)}
			</Footer>
		</>
	);
}
